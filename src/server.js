import bodyParser from 'body-parser';
import express from 'express';
import pino from 'pino';

const logger = pino({
    prettyPrint: true,
});

const app = express();
const port = parseInt(process.env.PORT, 10) || 8000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

// Returns a list of available rates
app.post('/rates.json', (req, res) => {
    logger.info('Received rates request', req.body);
    const rates = [{
        price: 10.55,
        provider: 'Jetti Provider',
        providerId: 'jetti_provider',
        quoteId: 'abc123',
        test: false,
        serviceLevel: 'First Class',
        serviceLevelToken: 'first_class',
    }];
    logger.info('Returning rates', { rates });
    return res.json({ rates });
});

// Returns a list of available rates
app.post('/label.json', (req, res) => {
    logger.info('Received label request', req.body);
    const label = {
        externalId: 'abc123',
        trackingCompany: 'Royal Mail',
        trackingNumber: '123ABC',
        serviceLevel: 'First Class',
        serviceLevelToken: 'first_class',
        price: 10.99,
        /* eslint max-len: 0 */
        labelUrl: 'https://shippo-delivery-east.s3.amazonaws.com/242d9a7081a441b9b6c27124e3f947cc.png?Signature=bv3SQUv59kfAkWcjDVW6jlhMKeU%3D&Expires=1585829500&AWSAccessKeyId=AKIAJGLCC5MYLLWIG42A',
        labelFiles: ['http://shipping.com/returns.png'],
    };
    logger.info('Returning label', { label });
    return res.json({ label });
});

// Transforms an inventory feed item for publishing
app.put('/transform.json', (req, res) => {
    logger.info('Received inventory feed variant', req.body);
    const transformed = {
        productType: 'top',
        images: ['https://transform.com?url=https://images.com/short.png'],
        tags: ['custom_blue', 'custom_large', 'custom_t-shirt'],
        options: [{
            name: 'Color',
            value: 'Blue',
            position: 1,
        }, {
            name: 'Size',
            value: 'Lg',
            position: 2,
        }],
    };
    logger.info('Returning transformed data', { transformed });
    return res.json({ transformed });
});


// Receive a pricing update
const pricingUpdates = [];
app.put('/pricing.json', (req, res) => {
    logger.info(`Received pricing update for ${req.body.channelVariant.id} to ${req.body.price.price}`, req.body);
    pricingUpdates.push(req.body);
    return res.json({});
});

// Receive an invenotry update
const inventoryUpdates = [];
app.put('/inventory.json', (req, res) => {
    logger.info(`Received inventory update for ${req.body.channelVariant.id} to ${req.body.available}`, req.body);
    inventoryUpdates.push(req.body);
    return res.json({});
});

app.listen(port, () => logger.info(`App listening on port ${port}`));
