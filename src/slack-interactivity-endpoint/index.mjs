import { createHmac } from "node:crypto";
import deleteTicket from "./delete.mjs";
import recoverTicket from "./recover.mjs";
import ignoreTicket from "./ignore.mjs";

export const handler = async (event) => {
  console.info("Received Slack interaction");

  const retryNum = event.headers["x-slack-retry-num"];
  const retryReason = event.headers["x-slack-retry-reason"];

  if (retryNum || retryReason) {
    console.debug(
      JSON.stringify({
        slack_retry_count: retryNum,
        slack_retry_reason: retryReason,
      }),
    );
  }

  // All Slack requests will have a signature that should be verified
  const slackSignature = event.headers["x-slack-signature"];

  if (!slackSignature) {
    console.warn("Missing Slack signature");
    return { statusCode: 400 };
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf-8")
    : event.body;

  const slackRequestTimestamp = event.headers["x-slack-request-timestamp"];
  const basestring = ["v0", slackRequestTimestamp, body].join(":");
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const requestSignature = `v0=${createHmac("sha256", signingSecret)
    .update(basestring)
    .digest("hex")}`;

  if (requestSignature !== slackSignature) {
    console.warn("Invalid Slack signature");
    return { statusCode: 400 };
  }

  const params = new URLSearchParams(body);

  let payload;

  try {
    payload = JSON.parse(params.get("payload"));
  } catch (error) {
    return { statusCode: 200 };
  }

  console.debug(JSON.stringify(payload));

  const choice = payload.actions[0].action_id;
  const suspensionId = +payload.actions[0].value;

  console.info(
    `User ${payload.user.id} requested to ${choice} suspended ticket ${suspensionId}`,
  );

  switch (choice) {
    case "IGNORE":
      await ignoreTicket(payload);
      break;
    case "DELETE":
      await deleteTicket(payload);
      break;
    case "RECOVER":
      await recoverTicket(payload);
      break;
    default:
      break;
  }

  return { statusCode: 200 };
};
