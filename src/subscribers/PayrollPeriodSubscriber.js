// src/subscribers/PayrollPeriodSubscriber.js
console.log("[Subscriber] Loading PayrollPeriodSubscriber");

class PayrollPeriodSubscriber {
  listenTo() {
    return "PayrollPeriod";
  }

  afterInsert(event) {
    console.log("[PayrollPeriodSubscriber] afterInsert:", {
      id: event.entity?.id,
      startDate: event.entity?.startDate,
      endDate: event.entity?.endDate
    });
  }

  afterUpdate(event) {
    console.log("[PayrollPeriodSubscriber] afterUpdate:", {
      id: event.entity?.id,
      status: event.entity?.status,
      updated: event.updatedColumns?.map(c => c.propertyName)
    });
  }

  afterRemove(event) {
    console.log("[PayrollPeriodSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id
    });
  }
}

module.exports = PayrollPeriodSubscriber;
