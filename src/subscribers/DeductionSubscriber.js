// src/subscribers/DeductionSubscriber.js

const Deduction = require("../entities/Deduction");

//@ts-check
console.log("[Subscriber] Loading DeductionSubscriber");

class DeductionSubscriber {
  listenTo() {
    return Deduction;
  }

  /**
   * @param {{ entity: { id: any; payrollRecordId: any; amount: any; type: any; }; }} event
   */
  afterInsert(event) {
    console.log("[DeductionSubscriber] afterInsert:", {
      id: event.entity?.id,
      payrollRecordId: event.entity?.payrollRecordId,
      amount: event.entity?.amount,
      type: event.entity?.type,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[DeductionSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(
        (/** @type {{ propertyName: any; }} */ c) => c.propertyName,
      ),
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[DeductionSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = DeductionSubscriber;
