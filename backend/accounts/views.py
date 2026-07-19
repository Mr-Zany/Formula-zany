from django.conf import settings
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import (
    build_verification_url,
    generate_verification_token,
    read_verification_token,
    send_verification_email,
)
from .models import User
from .serializers import ProfileSerializer, RegisterSerializer


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
