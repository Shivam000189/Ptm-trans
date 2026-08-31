const request = require('supertest');
const { app } = require('../index');
const { User, Bank, Transaction, Notification } = require('../src/models/schema');

describe('Account Transfer Endpoints', () => {
  let senderToken;
  let senderUser;
  let recipientToken;
  let recipientUser;

  beforeEach(async () => {
    // Register sender
    const senderRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Alice',
        lastName: 'Sender',
        email: 'alice@example.com',
        password: 'password123',
      });
    senderToken = senderRes.body.token;
    senderUser = senderRes.body.user;

    // Set known balance for sender (500)
    await Bank.findOneAndUpdate(
      { user: senderUser.id },
      { $set: { balance: 500 } }
    );

    // Register recipient
    const recipientRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Bob',
        lastName: 'Receiver',
        email: 'bob@example.com',
        password: 'password123',
      });
    recipientToken = recipientRes.body.token;
    recipientUser = recipientRes.body.user;

    // Set known balance for recipient (100)
    await Bank.findOneAndUpdate(
      { user: recipientUser.id },
      { $set: { balance: 100 } }
    );
  });

  describe('POST /api/account/transfer', () => {
    it('should fail with 401 without a token', async () => {
      const res = await request(app)
        .post('/api/account/transfer')
        .send({
          recipientEmail: 'bob@example.com',
          amount: 50,
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should transfer money successfully between two users and update both balances', async () => {
      const transferAmount = 150;

      const res = await request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientEmail: 'bob@example.com',
          amount: transferAmount,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Transfer successful');
      expect(res.body).toHaveProperty('transactionId');

      // Check updated balances
      const senderBank = await Bank.findOne({ user: senderUser.id });
      expect(senderBank.balance).toBe(350); // 500 - 150

      const recipientBank = await Bank.findOne({ user: recipientUser.id });
      expect(recipientBank.balance).toBe(250); // 100 + 150

      // Check transactions created
      const debitTx = await Transaction.findOne({
        sender: senderUser.id,
        recipient: recipientUser.id,
        type: 'debit',
      });
      expect(debitTx).not.toBeNull();
      expect(debitTx.amount).toBe(transferAmount);

      const creditTx = await Transaction.findOne({
        sender: senderUser.id,
        recipient: recipientUser.id,
        type: 'credit',
      });
      expect(creditTx).not.toBeNull();
      expect(creditTx.amount).toBe(transferAmount);

      // Check notifications created
      const recipientNotif = await Notification.findOne({
        user: recipientUser.id,
        type: 'money_received',
      });
      expect(recipientNotif).not.toBeNull();
      expect(recipientNotif.message).toContain('150');
    });

    it('should return 400 for insufficient balance', async () => {
      const excessiveAmount = 1000; // Sender only has 500

      const res = await request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientEmail: 'bob@example.com',
          amount: excessiveAmount,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Insufficient balance');

      // Check balances remained unchanged
      const senderBank = await Bank.findOne({ user: senderUser.id });
      expect(senderBank.balance).toBe(500);

      const recipientBank = await Bank.findOne({ user: recipientUser.id });
      expect(recipientBank.balance).toBe(100);
    });

    it('should return 400 when attempting to transfer money to oneself', async () => {
      const res = await request(app)
        .post('/api/account/transfer')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientEmail: 'alice@example.com',
          amount: 50,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Cannot transfer money to yourself');
    });
  });
});
