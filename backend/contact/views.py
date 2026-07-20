from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import send_contact_email
from .serializers import ContactSerializer


class ContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        send_contact_email(**serializer.validated_data)

        return Response({"detail": "Thanks -- your message has been sent."})
