# Shipping Integrations

This repository contains boilerplate for creating custom carrier integrations with Jetti.io. To get started, you'll first need to register your custom service in the Jetti integrations section:

https://app.jetti.io/shipping-integrations

To get started with the examples, you'll need to `npm install` or `yarn`. To run the dev server, run `PORT=8000 npm run start:dev` or `PORT=8000 yarn start:dev`.

The port number can be adjusted if needed. For testing, you may want to use something like https://ngrok.com/ to call the local setup from your Jetti API account.

## Generating rates
The rates endpoint (e.g. `POST /rates.json` in `src/index.js`) returns a list of available rates for a shipment. The endpoint will be sent a payload of data, containing the address and shipment details:

```json
{
	"company": {
		"name": "jetti-imac-1",
		"email": "support@jetti.io"
	},
	"parcelWeight": "0.1000",
	"toAddress": {
		"email": "vendor@email.com",
		"phone": "",
		"name": "Jack Jones",
		"firstName": "Jack",
		"lastName": "Jones",
		"addressLineOne": "1600 Pennsylvania Ave",
		"addressLineTwo": null,
		"city": "NW Washington",
		"state": "CA",
		"country": "US",
		"zip": "20500",
		"company": "Jack Inc"
	},
	"fromAddress": {
		"email": "vendor@email.com",
		"phone": "",
		"returnInHouse": true,
		"addressLineOne": "1051 S Coast Hwy 101 B",
		"addressLineTwo": "",
		"city": "Encinitas",
		"state": "CA",
		"country": "US",
		"zip": "92024",
		"company": "Jetti dropship"
	},
	"dimensions": {
		"length": 12.4,
		"width": 10.9,
		"height": 1.5,
		"distanceUnit": "in",
		"massUnit": "lb",
		"weight": "0.10"
	},
	"orderValue": 9.99,
	"iso": "USD",
    "items": [{
    	"quantity": 10,
    	"name": "HACK",
    	"price": 10,
    	"variant": {
    		"imagesMapped": [],
    		"images": [],
    		"displayName": "k1ns080qtd",
    		"costPrice": 0,
    		"commissionRate": 0,
    		"id": 2716,
    		"vendorId": 3594,
    		"productId": 2536,
    		"sku": "k1ns080qtd",
    		"name": "Default name",
    		"grams": 10,
    		"vendorSku": null,
    		"tags": null,
    		"taxable": true,
    		"product": {
    			"id": 2536,
    			"name": "My item gcw93yfuczp"
    		},
    		"option_values": []
    	}
    }]
}
```

This data can then be used to query external carrier integrations to return back to Jetti a list of available rates. A response must be received in 20 seconds. Multiple rates can be returned if needed, by passing in additional items in the `rates` array.

```json
{
	"rates": [{
		"price": 10.55,
		"provider": "Jetti Provider",
		"providerId": "jetti_provider",
		"quoteId": "abc123",
		"test": false,
		"serviceLevel": "First Class",
		"serviceLevelToken": "first_class"
	}]
}
```

## Printing a shipping label

Once a rate has been selected by the user, the `POST label.json` endpoint is then called with the following payload. The rateId maps back to the `quoteId` included in the previous `rates.json` response. You'll also find included the same data sent in the original `rates.json` request (such as the shipment weight) in case this is needed in the generation of the label.

```json
{
	"rateId": "abc123",
	"rate": {
		"test": false,
		"price": 10.55,
		"quoteId": "abc123",
		"provider": "Jetti Provider",
		"providerId": "jetti_provider",
		"serviceLevel": "First Class",
		"serviceLevelToken": "first_class",
		"shippingIntegrationId": 1
	},
	"toAddress": {
		"zip": "20500",
		"city": "NW Washington",
		"name": "Jack Smith",
		"email": "vendor@email.com",
		"phone": "",
		"state": "CA",
		"company": "Jack Inc",
		"country": "US",
		"lastName": "Jack",
		"firstName": "Smith",
		"addressLineOne": "1600 Pennsylvania Ave",
		"addressLineTwo": null
	},
	"fromAddress": {
		"zip": "92024",
		"city": "Encinitas",
		"email": "vendor@email.com",
		"phone": "",
		"state": "CA",
		"company": "Jetti dropship",
		"country": "US",
		"returnInHouse": true,
		"addressLineOne": "1051 S Coast Hwy 101 B",
		"addressLineTwo": ""
	},
	"dimensions": {
		"width": 10.9,
		"height": 1.5,
		"length": 12.4,
		"weight": "0.10",
		"massUnit": "lb",
		"distanceUnit": "in"
	},
	"parcelWeight": "0.10",
	"orderValue": "9.99",
	"iso": "USD",
    "items": [{
		"quantity": 10,
		"name": "HACK",
		"price": 10,
		"variant": {
			"imagesMapped": [],
			"images": [],
			"displayName": "k1ns080qtd",
			"costPrice": 0,
			"commissionRate": 0,
			"id": 2716,
			"vendorId": 3594,
			"productId": 2536,
			"sku": "k1ns080qtd",
			"name": "Default name",
			"grams": 10,
			"vendorSku": null,
			"tags": null,
			"taxable": true,
			"product": {
				"id": 2536,
				"name": "My item gcw93yfuczp"
			},
			"option_values": []
		}
	}]
}
```

This data can then be used to call an external service to generate a tracking number and shipping label. Jetti expects the data to be returned within 20 seconds.

```json
{
	"label": {
		"externalId": "abc123",
		"trackingCompany": "Royal Mail",
		"trackingNumber": "123ABC",
		"serviceLevel": "First Class",
		"serviceLevelToken": "first_class",
		"price": 10.99,
		"labelUrl": "http://shipping.com/label.png",
		"labelFiles": ["http://shipping.com/returns.png"]
	}
}
```

# Inventory feed transformations

You can set up a webhook to programatically transform an inventory feed variant as it's being published in Jetti to your online store. This endpoint will be called for each item being published. So, the data won't be transformed until an item has been published. An example response can be seen in the `transform.json` endpoint in `server.js`. All fields should be returned, even if the data has changed.  There is a max time out applied to these outbound requests of 10 seconds.

# Custom channels

The integration contains three sample implementations for receiving webhooks for pricing, inventory and fulfillments. These webhooks should return a 200 responses within the cut-off time configured on your account, which by default is 3 seconds.

# Creating an order

You can view the sample implementation for creating an order in the `create-sale.js` file. You'll need to create a `development.env` in the root of the repository. Then, run `script:create-sale`

    TOKEN={{your api token}}
    API_HOST=https://api.jetti.io
