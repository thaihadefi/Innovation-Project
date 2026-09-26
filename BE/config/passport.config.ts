import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import AccountCandidate from "../models/account-candidate.model";
import { verifiedEmailDomains } from "./variable";
import { emailTemplates } from "../helpers/email-template.helper";
import { sendEmail } from "../helpers/mail.helper";

export const configurePassport = (passportInstance: typeof passport): void => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:4001/auth/google/callback";

  if (!clientID || !clientSecret) {
    console.warn("[Passport] Google OAuth credentials missing. Google Strategy not initialized.");
    return;
  }

  passportInstance.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const rawEmail = profile.emails?.[0]?.value;
          if (!rawEmail) {
            return done(new Error("Google account email is not available."), undefined);
          }

          const email = rawEmail.toLowerCase().trim();
          const parts = email.split("@");
          const domain = parts.length === 2 ? parts[1].toLowerCase() : "";
          const isVerifiedStudent = verifiedEmailDomains.some((d) => domain === d);

          let parsedStudentId: string | undefined;
          let parsedCohort: number | undefined;

          if (isVerifiedStudent && parts[0]) {
            // Check if email prefix matches standard UIT 8-digit student ID (e.g. 21520123)
            if (/^\d{8}$/.test(parts[0])) {
              parsedStudentId = parts[0];
              const yearPrefix = parseInt(parts[0].slice(0, 2), 10);
              if (!Number.isNaN(yearPrefix)) {
                parsedCohort = 2000 + yearPrefix;
              }
            }
          }

          let candidate = await AccountCandidate.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (candidate) {
            if (candidate.status === "inactive") {
              return done(new Error("Your candidate account is inactive. Please contact support."), undefined);
            }

            let hasChanges = false;

            if (!candidate.googleId) {
              candidate.googleId = profile.id;
              hasChanges = true;
            }

            // Auto-verify if authenticated with valid student domain and not yet verified
            if (isVerifiedStudent && !candidate.isVerified) {
              candidate.isVerified = true;
              hasChanges = true;
            }

            if (!candidate.avatar && profile.photos?.[0]?.value) {
              candidate.avatar = profile.photos[0].value;
              hasChanges = true;
            }

            if (!candidate.studentId && parsedStudentId) {
              candidate.studentId = parsedStudentId;
              hasChanges = true;
            }

            if (!candidate.cohort && parsedCohort) {
              candidate.cohort = parsedCohort;
              hasChanges = true;
            }

            if (hasChanges) {
              await candidate.save();
            }

            return done(null, candidate);
          }

          // Create new candidate
          const fullName = profile.displayName || "Student";
          const avatar = profile.photos?.[0]?.value || "";

          candidate = new AccountCandidate({
            fullName,
            email,
            avatar,
            googleId: profile.id,
            studentId: parsedStudentId,
            cohort: parsedCohort,
            isVerified: isVerifiedStudent,
            status: "active",
          });

          await candidate.save();

          if (isVerifiedStudent && email) {
            const { subject, html } = emailTemplates.studentVerified(
              fullName,
              "automatically via your verified UIT Google account"
            );
            void sendEmail(email, subject, html).catch((err) => {
              console.error("[Candidate] Failed to send auto-verification welcome email:", err);
            });
          }

          return done(null, candidate);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
};
