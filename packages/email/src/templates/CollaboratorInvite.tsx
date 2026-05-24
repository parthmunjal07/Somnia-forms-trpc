import * as React from "react";
import { Text, Button, Link } from "@react-email/components";
import SomniaEmailLayout from "../components/SomniaEmailLayout";

interface CollaboratorInviteProps {
  architectName: string;
  formTitle: string;
  roleName: "THE_FORGER" | "THE_SHADE";
  inviteUrl: string;
}

export const CollaboratorInvite: React.FC<CollaboratorInviteProps> = ({
  architectName = "Cobb",
  formTitle = "Project Inception",
  roleName = "THE_FORGER",
  inviteUrl = "http://localhost:3000/invite/token",
}) => {
  const roleDisplay = roleName === "THE_FORGER" ? "Forger" : "Shade";

  return (
    <SomniaEmailLayout previewText={`You have been invited to join ${formTitle}`}>
      <Text className="text-xl font-bold tracking-widest text-primary uppercase mb-6 mt-4">
        Collaboration Request
      </Text>
      
      <Text className="text-sm leading-7 text-secondary/80 mb-6">
        <strong className="text-primary">{architectName}</strong> has invited you to enter their dreamscape and assist with <strong className="text-primary">{formTitle}</strong>.
      </Text>
      
      <div className="bg-[rgba(10,10,15,0.5)] border border-[rgba(200,216,232,0.05)] p-4 rounded-sm mb-6">
        <Text className="text-[10px] text-secondary/50 tracking-widest uppercase m-0 mb-1">
          Assigned Role
        </Text>
        <Text className="text-sm text-totem tracking-widest uppercase font-bold m-0">
          {roleDisplay}
        </Text>
      </div>

      <Text className="text-sm leading-7 text-secondary/80 mb-8">
        {roleName === "THE_FORGER" 
          ? "As a Forger, you will have the ability to alter the architecture of the form and manage extracted signals."
          : "As a Shade, you will be able to view and analyze extracted signals, but cannot alter the architecture."}
      </Text>
      
      <Button
        href={inviteUrl}
        className="bg-totem text-limbo font-bold text-xs tracking-widest uppercase px-6 py-4 rounded-sm mt-2 mb-6 border-none"
      >
        Accept Invitation
      </Button>

      <Text className="text-xs text-secondary/60 leading-6">
        If you do not have an identity forged in this reality, you will be prompted to create one before entering the dreamscape.
        <br />
        <br />
        <span className="break-all text-secondary/40">
          Or copy this link: <Link href={inviteUrl} className="text-totem hover:text-totem-hover">{inviteUrl}</Link>
        </span>
      </Text>
    </SomniaEmailLayout>
  );
};

export default CollaboratorInvite;
