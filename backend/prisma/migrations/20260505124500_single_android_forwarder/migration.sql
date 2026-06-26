-- A single Android forwarder can receive payment notifications for the whole
-- system. The branch is only known after a notification is matched to an order.
ALTER TABLE "IncomingPaymentEvent" ALTER COLUMN "branchId" DROP NOT NULL;
