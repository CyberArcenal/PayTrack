// src/subscribers/PayrollRecordSubscriber.js
console.log("[Subscriber] Loading PayrollRecordSubscriber");

class PayrollRecordSubscriber {
  listenTo() {
    return "PayrollRecord";
  }

  afterInsert(event) {
    console.log("[PayrollRecordSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeId: event.entity?.employeeId,
      periodId: event.entity?.periodId,
      netPay: event.entity?.netPay
    });
  }

  afterUpdate(event) {
    console.log("[PayrollRecordSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName)
    });
  }

  afterRemove(event) {
    console.log("[PayrollRecordSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id
    });
  }
}

module.exports = PayrollRecordSubscriber;
