import Bottleneck from 'bottleneck';
import dotenv from 'dotenv';
import request from 'request-promise-native';

dotenv.config({
    path: `${__dirname}/../${process.env.NODE_ENV}.env`,
    silent: true,
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
    // Fetch the order to duplicate
    const id = 1234;
    const uri = `${process.env.API_HOST}/api/sales/${id}.json`;
    const sale = await throttle({
        method: 'GET',
        uri,
        qs: {
            include: 'SaleItem',
        },
        json: true,
        headers,
    });
    for (const saleItem of sale.sale_items) {
        // Add an additional line item
        await throttle({
            method: 'POST',
            uri: `${process.env.API_HOST}/api/sale-items.json`,
            body: {
                saleId: saleItem.saleId,
                // Set the variant of the additional item to add
                variantId: 1234,
                properties: [{
                    name: 'clone-from',
                    value: saleItem.id.toString(),
                }],
            },
            json: true,
            headers,
        });
    }
    await throttle({
        method: 'PUT',
        uri,
        body: {
            status: 'finalized',
        },
        json: true,
        headers,
    });
};

go();
