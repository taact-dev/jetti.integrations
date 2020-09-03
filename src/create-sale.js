import Bottleneck from 'bottleneck';
import dotenv from 'dotenv';
import pino from 'pino';
import request from 'request-promise-native';

dotenv.config({
    path: `${__dirname}/../${process.env.NODE_ENV}.env`,
    silent: true,
});

const logger = pino({
    prettyPrint: true,
});

// Allow up to 2 calls per second
const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 2000,
});

// Throttle the requests
const throttle = async (...params) => limiter.schedule(() => request(...params));

const headers = {
    Authorization: `Bearer ${process.env.TOKEN}`,
};

const go = async () => {
    // Fetch the channel and a test SKU to import against.
    const channel = await throttle({
        method: 'GET',
        uri: `${process.env.API_HOST}/api/channels.json`,
        qs: {
            limit: 1,
        },
        json: true,
        headers,
    });
    const channelId = 87 || channel.id;
    const [channelVariant] = await throttle({
        method: 'GET',
        uri: `${process.env.API_HOST}/api/channel-variants.json`,
        qs: {
            where: {
                channelId,
            },
            limit: 1,
        },
        json: true,
        headers,
    });
    logger.info(`Exporting channel-variant for ${channelVariant.externalId}`, channelVariant);
    const sale = await throttle({
        method: 'POST',
        uri: `${process.env.API_HOST}/api/channels/${channelId}/manual-sale.json`,
        json: true,
        headers,
        body: {
            externalId: 1234,
            saleDefaults: {},
            customer: {
                firstName: 'Test',
                lastName: 'user',
                email: 'test@user.com',
            },
            lineItems: [{
                externalId: 'line-external-id',
                name: 'line-item-name',
                quantity: 10,
                price: 20,
                taxable: true,
                variant: {
                    // variant.externalId
                    externalId: channelVariant.externalId,
                    externalSku: channelVariant.externalSku,
                },
                properties: [{
                    key: 'property-key',
                    value: 'property-value',
                }],
            }],
            shipping: [{
                code: 'shipping-code',
                name: 'shipping-name',
                serviceLevel: 'shipping-service-level',
                price: 10,
            }],
            source: 'manual',
        },
    });
    logger.info('Export sale to Jetti', sale);
};

go();
