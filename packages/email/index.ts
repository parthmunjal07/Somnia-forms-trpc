import { Resend } from "resend";
import { render } from "@react-email/components";
import VerifyEmail from "./src/templates/VerifyEmail";
import NewSignalNotification from "./src/templates/NewSignalNotification";
import SurfacingConfirmation from "./src/templates/SurfacingConfirmation";
import ExpiryWarning from "./src/templates/ExpiryWarning";
import CollaboratorInvite from "./src/templates/CollaboratorInvite";
import * as React from "react";

// Ensure RESEND_API_KEY is available in the environment where this is called
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing. Emails will be logged but not sent.");
    return null;
  }
  return new Resend(apiKey);
};

const FROM_EMAIL = "Somnia <system@somnia.app>";

async function sendEmail(
  to: string,
  subject: string,
  reactElement: React.ReactElement
) {
  const resend = getResendClient();
  
  if (!resend) {
    // Development fallback
    const html = await render(reactElement);
    console.log(`[EMAIL DEV LOG] Would send email to ${to}`);
    console.log(`[EMAIL DEV LOG] Subject: ${subject}`);
    console.log(`[EMAIL DEV LOG] HTML length: ${html.length}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react: reactElement,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export const sendVerificationEmail = async ({
  to,
  token,
  baseUrl,
}: {
  to: string;
  token: string;
  baseUrl: string;
}) => {
  return sendEmail(
    to,
    "Confirm your extraction",
    React.createElement(VerifyEmail, { token, baseUrl })
  );
};

export const sendSignalNotification = async ({
  to,
  formTitle,
  timestamp,
  fieldPreviews,
  dashboardUrl,
}: {
  to: string;
  formTitle: string;
  timestamp: string;
  fieldPreviews: { label: string; value: string }[];
  dashboardUrl: string;
}) => {
  return sendEmail(
    to,
    `New Signal: ${formTitle}`,
    React.createElement(NewSignalNotification, {
      formTitle,
      timestamp,
      fieldPreviews,
      dashboardUrl,
    })
  );
};

export const sendSurfacingConfirmation = async ({
  to,
  formTitle,
  submissionTime,
}: {
  to: string;
  formTitle: string;
  submissionTime: string;
}) => {
  return sendEmail(
    to,
    `Signal Confirmed: ${formTitle}`,
    React.createElement(SurfacingConfirmation, { formTitle, submissionTime })
  );
};

export const sendExpiryWarning = async ({
  to,
  formTitle,
  reason,
  dashboardUrl,
}: {
  to: string;
  formTitle: string;
  reason: "cap" | "expiry";
  dashboardUrl: string;
}) => {
  const subject =
    reason === "cap"
      ? `Dreamscape Almost Full: ${formTitle}`
      : `Dreamscape Expiring Soon: ${formTitle}`;
  return sendEmail(
    to,
    subject,
    React.createElement(ExpiryWarning, { formTitle, reason, dashboardUrl })
  );
};

export const sendCollaboratorInvite = async ({
  to,
  architectName,
  formTitle,
  roleName,
  inviteUrl,
}: {
  to: string;
  architectName: string;
  formTitle: string;
  roleName: "THE_FORGER" | "THE_SHADE";
  inviteUrl: string;
}) => {
  return sendEmail(
    to,
    `Collaboration Request: ${formTitle}`,
    React.createElement(CollaboratorInvite, {
      architectName,
      formTitle,
      roleName,
      inviteUrl,
    })
  );
};
