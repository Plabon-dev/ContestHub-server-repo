const express = require('express');
const cors = require('cors');
// var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;




// middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ull5nsx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        

        const contestCollection = client.db('contestHub').collection('contests');
        const userCollection = client.db('contestHub').collection('users');
        const paymentCollection = client.db('contestHub').collection('payments');

        // user related api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentCollection.insertOne(payment);
            res.send(paymentResult)
        })
        app.post('/contests', async (req, res) => {
            const contest = req.body;
            const contestResult = await contestCollection.insertOne(contest);
            res.send(contestResult)
        })

        app.get('/contests', async (req, res) => {
            const result = await contestCollection.find().toArray();
            res.send(result);
        })
        app.get('/contests/let', async (req, res) => {
            const filter = req.query;
            const query = {
                tags: { $regex: filter.search, $options: 'i' }
            }
            const cursor = contestCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/contests/creator', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { creator: req.query.email }
            }
            const cursor = contestCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })
        app.get('/payments', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await paymentCollection.find().toArray();
            // console.log(result);
            res.send(result);
        })
        app.get('/contests', async (req, res) => {
            const email = req.query.email;
            const query = { creator: email };
            const result = await contestCollection.find(query).toArray();
            console.log(result);
            res.send(result);
        })

        app.get('/checkAdmin/:email', async (req, res) => {
            const email = req.params.email;                      
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
              admin = user?.role === 'admin';
            }
            res.send({ admin });
          })
        app.get('/checkCreator/:email', async (req, res) => {
            const email = req.params.email;                      
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let creator = false;
            if (user) {
              creator = user?.role === 'creator';
            }
            res.send({ creator });
          })


        app.put('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedContest = req.body;
            const contest = {
                $set: {
                    name: updatedContest.name,
                    image: updatedContest.image,
                    tags: updatedContest.tags,
                    description: updatedContest.description,
                    price: updatedContest.price,
                    prize: updatedContest.prize,
                    deadline: updatedContest.deadline,
                    instruction: updatedContest.instruction,
                    creator: updatedContest.creator,
                }
            }

            const result = await contestCollection.updateOne(filter, contest, options);
            res.send(result);

        });
        app.put('/contests/count/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedContest = req.body;
            const contest = {
                $set: {
                    participants: updatedContest.participants,

                }
            }

            const result = await contestCollection.updateOne(filter, contest, options);
            res.send(result);

        });


        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })
        app.patch('/users/creator/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'creator'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })
        app.patch('/contests/approve/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Approved'
                }
            }
            const result = await contestCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })
        app.patch('/payments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Applied'
                }
            }
            const result = await paymentCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })
        app.patch('/payments/winner/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Winner'
                }
            }
            const result = await paymentCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        app.get('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await contestCollection.findOne(query);
            res.send(result);
        })

        app.delete('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await contestCollection.deleteOne(query);
            res.send(result);
        })


        // payment intent

        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            // console.log('amount intent', amount, typeof(amount));

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('ContestHub server running')
})
app.listen(port, () => {
    console.log(`ContestHub server running on port ${port}`)
}) 