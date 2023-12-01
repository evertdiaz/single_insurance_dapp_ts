import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { DappInsuranceClient } from '../contracts/clients/DappInsuranceClient';

const fixture = algorandFixture();

let appClient: DappInsuranceClient;
let analystAccount: algosdk.Account;
let customerAccount: algosdk.Account;
let algod: algosdk.Algodv2;
let assetId: number;

describe('DappInsurance', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount, kmd } = fixture.context;
    algod = fixture.context.algod;

    // Instantiate a new account that will be the analyst
    analystAccount = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'analystAccount',
        fundWith: algokit.algos(10),
      },
      algod,
      kmd
    );

    // Instantiate a new account for customer
    customerAccount = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'customer',
        fundWith: algokit.algos(10),
      },
      algod,
      kmd
    );

    // Creates the client to interact with the contract
    appClient = new DappInsuranceClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );
  });

  test('should create an application', async () => {
    await appClient.create.createApplication({ analyst: analystAccount.addr, customer: customerAccount.addr });
    await appClient.appClient.fundAppAccount(algokit.microAlgos(200_000));

    const analyst = (await appClient.getGlobalState()).analyst!.asByteArray();
    const customer = (await appClient.getGlobalState()).customer!.asByteArray();

    expect(analyst.valueOf()).toEqual(algosdk.decodeAddress(analystAccount.addr).publicKey);
    expect(customer.valueOf()).toEqual(algosdk.decodeAddress(customerAccount.addr).publicKey);
  });

  test('should register an asset', async () => {
    const assetName = 'Car';
    const assetType = 'Vehicle';
    const assetValue = 10000;
    const assetDescription = 'Audi A3';
    await appClient.registerAsset({ assetName, assetType, assetValue, assetDescription }, { sender: customerAccount });
    const globalState = await appClient.getGlobalState();
    expect(globalState.assetName!.asString()).toMatch(assetName);
    expect(globalState.assetType!.asString()).toMatch(assetType);
    expect(globalState.asssetValue!.asNumber()).toEqual(assetValue);
    expect(globalState.assetDescription!.asString()).toMatch(assetDescription);
    expect(globalState.assetStatus!.asString()).toMatch('requested');
  });

  test('should reject the request', async () => {
    const comments = 'The asset is too old';
    await appClient.reviewRequest({ acceptance: false, comments }, { sender: analystAccount });
    const globalState = await appClient.getGlobalState();
    expect(globalState.assetStatus!.asString()).toMatch('rejected');
  });

  test('should accept the request', async () => {
    const comments = 'The asset is brand new';
    await appClient.reviewRequest(
      { acceptance: true, comments },
      { sender: analystAccount, sendParams: { fee: algokit.microAlgos(2_000) } }
    );
    const globalState = await appClient.getGlobalState();
    assetId = globalState.asaId!.asNumber();
    expect(globalState.assetStatus!.asString()).toMatch('accepted');
    expect(assetId).toBeGreaterThan(1000);
  });

  test('should receive the ASA', async () => {
    const optinTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: customerAccount.addr,
      to: customerAccount.addr,
      amount: 0,
      suggestedParams: await algokit.getTransactionParams(undefined, algod),
      assetIndex: Number(assetId),
    });
    await appClient.receiveToken(
      { asaId: assetId, optin: optinTxn },
      { sender: customerAccount, sendParams: { fee: algokit.microAlgos(2_000) } }
    );
  });
});
