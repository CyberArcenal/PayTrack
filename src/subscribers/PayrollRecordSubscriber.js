// src/subscribers/PayrollRecordSubscriber.js

const PayrollRecord = require("../entities/PayrollRecord");

//@ts-check
console.log("[Subscriber] Loading PayrollRecordSubscriber");

class PayrollRecordSubscriber {
  listenTo() {
    return PayrollRecord;
  }

  /**
   * @param {{ entity: { id: any; employeeId: any; periodId: any; netPay: any; }; }} event
   */
  afterInsert(event) {
    console.log("[PayrollRecordSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeId: event.entity?.employeeId,
      periodId: event.entity?.periodId,
      netPay: event.entity?.netPay,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[PayrollRecordSubscriber] afterUpdate:", {
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
    console.log("[PayrollRecordSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = PayrollRecordSubscriber;
