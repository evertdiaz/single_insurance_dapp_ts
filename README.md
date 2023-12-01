# Single Insurance dapp

## Logic

Here you will find a complete example on how to create an application where a customer can request and receive an insurance for specific assets, this application follows the next system flow including the actors and functions inside of it:

![Single insurance diagram](https://raw.githubusercontent.com/evertdiaz/single_insurance_dapp_ts/main/respurces/single_insurance_diagram.png "Single insurance diagram")

## Main files to look at

If it's your first time coding with tealscript on algorand, you may only want to check the next files:

- `contracts/dapp_insurance.algo.ts` - The smart contract of the application, here you will find the main business logic
- `__test__/dapp_insurance.test.ts` - This file allows you to run some tests cases, here you will see how to use the client and comunicate with the contract. You can run it by typing `npm run test` inside the project folder.
- `contracts/artifacts/DappInsurance.arc4.json` - With this file you can go to https://app.dappflow.org/abi-studio/abis and upload it to interact with the contract in a graphic interface provided by dappflow

## Functions

- `createApplication` - The main function to create the contract and initialize the mandatorys variables such as who is the analyst for this insurance request, who is the customer and the initial status of the request.
- `registerAsset` - This function allows only to the specific customer to register the needed data of the asset to be insured and fills an insurance request.
- `reviewRequest` - With this function, only the assigned analyst, after reviewing the data of the registered asset in the customer insurance request, will be able to approve or reject the request and leave some comments about the decision that the customer will be able to modify or improve on his request.
- `receiveToken` - Once approved, the customer will be able to use this function to receive his insurance proof in a form of token (Algorand Standard Asset)

## Architecture decisions (Advanced topic)

- The dapp uses only `global state` to avoid the friction of calculation of boxes when modifying the data of the insurance request, so the customer experience can be smooth.
- 
- The request has the next status:
  - `none` when the contract is created
  - `requested` when the customer has just filled the insurance request
  - `rejected` when the analyst rejected the request, in this scenario, the customer is able to re submit the request
  - `approved` when the analyst approved the rqeuest, here the customer can't modify the request
  - `insured` the final status when the customer has received the token that proofs his insurance

## To do

- Add an ARC on the minted token
- Avoid atomic transactions for a smoother onboarding of new algorand developers