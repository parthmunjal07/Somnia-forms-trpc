import * as React from "react";
import { Text, Button, Link } from "@react-email/components";
import SomniaEmailLayout from "../components/SomniaEmailLayout";

interface VerifyEmailProps {
  token: string;
  baseUrl: string;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({
  token = "TEST_TOKEN_32_BYTES",
  baseUrl = "http://localhost:3000",
}) => {
  const verificationLink = `${baseUrl}/api/auth/verify?token=${token}`;

  return (
    <SomniaEmailLayout previewText="Confirm your extraction">
      <Text className="text-xl font-bold tracking-widest text-primary uppercase mb-6 mt-4">
        Verify Your Identity
      </Text>
      
      <Text className="text-sm leading-7 text-secondary/80">
        Architect, a new identity projection has been initiated using this email.
        To secure your access to the workshop and begin constructing your
        dreamscapes, you must verify your connection.
      </Text>
      
      <Button
        href={verificationLink}
        className="bg-totem text-limbo font-bold text-xs tracking-widest uppercase px-6 py-4 rounded-sm mt-6 mb-8 border-none"
      >
        Confirm Extraction
      </Button>
      
      <Text className="text-xs text-secondary/60 leading-6">
        This link will expire in 24 hours. If you did not initiate this projection, 
        you can safely ignore this signal.
        <br />
        <br />
        <span className="break-all text-secondary/40">
          Or copy this link: <Link href={verificationLink} className="text-totem hover:text-totem-hover">{verificationLink}</Link>
        </span>
      </Text>
    </SomniaEmailLayout>
  );
};

export default VerifyEmail;
