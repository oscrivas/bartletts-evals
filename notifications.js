// Sends a real email to every manager when a survey is sent, using EmailJS
// (a free, no-backend-needed email service that works from the browser).
//
// SETUP: see README.md "Part 3b — EmailJS setup" for exactly where to get
// these three values and how to build the template.

import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_akx2etc";
const EMAILJS_TEMPLATE_ID = "template_we67nek";
const EMAILJS_PUBLIC_KEY = "eWq2lX0LjcuIG4QCz";

// This is the URL managers should click in the email to go straight to the
// app. Update it once you know your real GitHub Pages URL (Part 6 of the
// README), then redeploy.
const APP_URL = "https://YOUR-USERNAME.github.io/bartletts-evals/";

export async function sendSurveyEmails(managers, survey) {
  const deadlineLabel = new Date(survey.deadline).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const results = await Promise.allSettled(
    managers.map((m) =>
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: m.email,
          to_name: m.name,
          employee_name: survey.employee,
          role_name: survey.role,
          deadline: deadlineLabel,
          app_url: APP_URL,
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      )
    )
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error("Some survey emails failed to send:", failures);
    return false;
  }
  return true;
}
