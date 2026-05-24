import * as React from "react";
import { Text, Button } from "@react-email/components";
import SomniaEmailLayout from "../components/SomniaEmailLayout";

interface ExpiryWarningProps {
  formTitle: string;
  reason: "cap" | "expiry";
  dashboardUrl: string;
}

export const ExpiryWarning: React.FC<ExpiryWarningProps> = ({
  formTitle = "Project Inception",
  reason = "cap",
  dashboardUrl = "http://localhost:3000/dashboard",
}) => {
  const isCap = reason === "cap";
  const title = isCap ? "Dreamscape Almost Full" : "Dreamscape Expiring Soon";
  const message = isCap
    ? `Your form "${formTitle}" has reached 90% of its maximum response limit. Once the limit is hit, the dreamscape will collapse and no further signals can be extracted.`
    : `Your form "${formTitle}" will expire in less than 24 hours. Once expired, the dreamscape will collapse and no further signals can be extracted.`;

  return (
    <SomniaEmailLayout previewText={title}>
      <Text className="text-xl font-bold tracking-widest text-primary uppercase mb-6 mt-4">
        {title}
      </Text>
      
      <Text className="text-sm leading-7 text-secondary/80 mb-6">
        Architect, a critical alert regarding your projection:
      </Text>
      
      <div className="bg-[rgba(201,147,58,0.1)] border border-[rgba(201,147,58,0.2)] p-4 rounded-sm mb-6">
        <Text className="text-sm text-totem m-0 leading-6">
          {message}
        </Text>
      </div>
      
      <Text className="text-sm leading-7 text-secondary/80 mb-6">
        To prevent disruption, you can extend the extraction parameters from your workshop dashboard.
      </Text>

      <Button
        href={dashboardUrl}
        className="bg-totem text-limbo font-bold text-xs tracking-widest uppercase px-6 py-4 rounded-sm mt-2 border-none"
      >
        Modify Parameters
      </Button>
    </SomniaEmailLayout>
  );
};

export default ExpiryWarning;
