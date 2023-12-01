import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class DappInsurance extends Contract {
  analyst = GlobalStateKey<Address>();

  customer = GlobalStateKey<Address>();

  assetName = GlobalStateKey<string>();

  assetType = GlobalStateKey<string>();

  asssetValue = GlobalStateKey<number>();

  assetDescription = GlobalStateKey<string>();

  assetStatus = GlobalStateKey<string>();

  analystComments = GlobalStateKey<string>();

  asaId = GlobalStateKey<Asset>();

  /**
   * Creates the contract with initial addresses
   *
   * @param analyst - The address of who will review and approve asset insurance
   * @param customer - The address of the person who will request the asset insurance evaluation
   * @returns void
   *
   */

  createApplication(analyst: Address, customer: Address): void {
    this.analyst.value = analyst;
    this.customer.value = customer;
    this.assetStatus.value = 'none';
  }

  /**
   * Allows customer to register an asset for insurance
   *
   * @param assetName - The name of the asset to insure
   * @param assetType - The type of the asset to insure
   * @param asssetValue - The value of the asset to insure
   * @param assetDescription - The description of the asset to insure
   * @returns void
   *
   */

  registerAsset(assetName: string, assetType: string, assetValue: number, assetDescription: string): void {
    verifyTxn(this.txn, { sender: this.customer.value });
    assert(this.assetStatus.value === 'rejected' || this.assetStatus.value === 'none');
    this.assetName.value = assetName;
    this.assetType.value = assetType;
    this.asssetValue.value = assetValue;
    this.assetDescription.value = assetDescription;
    this.assetStatus.value = 'requested';
  }

  /**
   * Allows customer to register an asset for insurance
   *
   * @param acceptance - The boolean value of whether the asset is accepted or not
   * @returns void
   *
   */

  reviewRequest(acceptance: boolean, comments: string): void {
    verifyTxn(this.txn, { sender: this.analyst.value });
    assert(
      this.assetStatus.value === 'requested' ||
        this.assetStatus.value === 'none' ||
        this.assetStatus.value === 'rejected'
    );
    this.analystComments.value = comments;
    if (acceptance) {
      this.assetStatus.value = 'accepted';
      const asaId = sendAssetCreation({
        configAssetTotal: 1,
        configAssetDecimals: 0,
        configAssetName: this.assetName.value,
        configAssetUnitName: 'INSUR',
        note: 'Token for asset: ' + this.assetName.value,
      });
      this.asaId.value = asaId;
    } else {
      this.assetStatus.value = 'rejected';
    }
  }

  /**
   * Allows customer to register an asset for insurance
   *
   * @param asaId - The ID of the ASA to receive
   * @param optin - The optin transaction to receive the ASA
   * @returns void
   *
   */

  receiveToken(asaId: Asset, optin: AssetTransferTxn): void {
    verifyTxn(this.txn, { sender: this.customer.value });
    verifyTxn(optin, {
      sender: this.customer.value,
      assetReceiver: this.customer.value,
      xferAsset: asaId,
      assetAmount: 0,
    });
    assert(this.asaId.value === asaId);
    assert(this.assetStatus.value === 'accepted');
    sendAssetTransfer({
      assetReceiver: this.customer.value,
      assetAmount: 1,
      xferAsset: asaId,
    });
    this.assetStatus.value = 'insured';
  }
}
