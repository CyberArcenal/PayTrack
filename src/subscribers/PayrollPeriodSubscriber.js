// src/subscribers/PayrollPeriodSubscriber.js

const PayrollPeriod = require("../entities/PayrollPeriod");

//@ts-check
console.log("[Subscriber] Loading PayrollPeriodSubscriber");

class PayrollPeriodSubscriber {
  listenTo() {
    return PayrollPeriod;
  }

  /**
   * @param {{ entity: { id: any; startDate: any; endDate: any; }; }} event
   */
  afterInsert(event) {
    console.log("[PayrollPeriodSubscriber] afterInsert:", {
      id: event.entity?.id,
      startDate: event.entity?.startDate,
      endDate: event.entity?.endDate,
    });
  }

  /**
   * @param {{ entity: { id: any; status: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[PayrollPeriodSubscriber] afterUpdate:", {
      id: event.entity?.id,
      status: event.entity?.status,
      updated: event.updatedColumns?.map(
        (/** @type {{ propertyName: any; }} */ c) => c.propertyName,
      ),
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[PayrollPeriodSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = PayrollPeriodSubscriber;
