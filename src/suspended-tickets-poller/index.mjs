/* eslint-disable no-await-in-loop */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { WebClient } from "@slack/web-api";
import ticketMessage from "./message.mjs";

const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);

const zendeskApiCreds = `${process.env.ZENDESK_API_USERNAME}:${process.env.ZENDESK_API_TOKEN}`;
const zendeskApiAuthHeader = `Basic ${btoa(zendeskApiCreds)}`;

export const handler = async () => {
  const resp = await fetch("https://prx.zendesk.com/api/v2/suspended_tickets", {
    method: "GET",
    headers: new Headers({
      Authorization: zendeskApiAuthHeader,
      "Content-Type": "application/json",
    }),
  });

  const payload = await resp.json();
  const tickets = payload.suspended_tickets;

  console.info(`Found ${tickets.length} suspended tickets`);

  if (tickets.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const ticket of tickets) {
      // Look for the ticket im the cache
      const { Item } = await dynamodbClient.send(
        new GetItemCommand({
          TableName: process.env.SUSPENDED_TICKET_CACHE_TABLE_NAME,
          Key: marshall({
            suspension_id: `${ticket.id}`,
          }),
        }),
      );

      // If the ticket isn't int the cache, add it to the cache and send a
      // message to Slack
      if (!Item) {
        console.info(`Notifying ticket ${ticket.id}`);

        // Send message
        const msg = ticketMessage(ticket);
        await web.chat.postMessage(msg);

        // Add ticket to cache with a TTL
        await dynamodbClient.send(
          new PutItemCommand({
            TableName: process.env.SUSPENDED_TICKET_CACHE_TABLE_NAME,
            Item: marshall({
              suspension_id: `${ticket.id}`,
              // Expire the cache in 7 days. If any suspended tickets haven't
              // been deleted or recovered after 7 days, they will generate a
              // new notification in Slack so they don't get lost
              cache_expiration: Math.round(Date.now() / 1000) + 86400 * 7,
            }),
          }),
        );
      } else {
        console.info(`Ignoring cached ticket ${ticket.id}`);
      }
    }
  }
};
