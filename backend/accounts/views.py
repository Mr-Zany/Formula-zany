from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import (
    build_reset_url,
    build_verification_url,
    generate_reset_token,
    generate_verification_token,
    read_reset_token,
    read_verification_token,
    send_password_reset_email,
    send_verification_email,
)
from .models import User
from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileSerializer,
    RegisterSerializer,
)


class ProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Section 6a: "Referrals and Profile Settings stay locked until the
        # email is verified" -- reading your own profile is fine either
        # way, only edits are gated.
        if not request.user.email_verified:
            return Response(
                {"detail": "Verify your email before editing Profile Settings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)


class RegisterView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = generate_verification_token(user)
        verification_url = build_verification_url(token)
        send_verification_email(user, verification_url)

        data = {
            "id": user.id,
            "email": user.email,
            "detail": "Account created. Check your email to verify your address.",
        }
        # Dev convenience only: with no email provider wired up yet, this is
        # the only way to actually get the link during local testing. Never
        # exposed outside DEBUG, since that would defeat email verification.
        if settings.DEBUG:
            data["verification_url"] = verification_url

        return Response(data, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        user_id = read_verification_token(token) if token else None
        user = User.objects.filter(pk=user_id).first() if user_id else None

        if user is None:
            return Response(
                {"detail": "Invalid or expired verification link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=["email_verified"])

        return Response({"detail": "Email verified."})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Always the same response regardless of whether the email is
        # registered -- doesn't reveal which addresses have accounts.
        data = {
            "detail": "If an account exists for that email, a reset link has been sent."
        }

        user = User.objects.filter(
            email=serializer.validated_data["email"]
        ).first()
        if user is not None:
            token = generate_reset_token(user)
            reset_url = build_reset_url(token)
            send_password_reset_email(user, reset_url)
            if settings.DEBUG:
                data["reset_url"] = reset_url

        return Response(data)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id, pw_fingerprint, error = read_reset_token(
            serializer.validated_data["token"]
        )
        if error == "expired":
            return Response(
                {"detail": "This link has expired. Request a new one to reset your password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(pk=user_id).first() if user_id else None
        # The password fingerprint must still match the user's *current*
        # hash -- a successful reset changes it, so any other outstanding
        # token (which encoded the old hash) is rejected here as invalid.
        if error or user is None or pw_fingerprint != user.password[-12:]:
            return Response(
                {"detail": "Invalid or already-used reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_password = serializer.validated_data["new_password"]
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response({"new_password": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"detail": "Password updated. You can now log in with your new password."})
