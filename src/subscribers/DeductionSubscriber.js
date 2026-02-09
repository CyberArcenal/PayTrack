// src/subscribers/DeductionSubscriber.js
console.log("[Subscriber] Loading DeductionSubscriber");

class DeductionSubscriber {
  listenTo() {
    return "Deduction";
  }

  afterInsert(event) {
    console.log("[DeductionSubscriber] afterInsert:", {
      id: event.entity?.id,
      payrollRecordId: event.entity?.payrollRecordId,
      amount: event.entity?.amount,
      type: event.entity?.type
    });
  }

  afterUpdate(event) {
    console.log("[DeductionSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName)
    });
  }

  afterRemove(event) {
    console.log("[DeductionSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id
    });
  }
}

module.exports = DeductionSubscriber;
