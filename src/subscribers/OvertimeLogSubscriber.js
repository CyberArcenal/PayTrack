// src/subscribers/OvertimeLogSubscriber.js
console.log("[Subscriber] Loading OvertimeLogSubscriber");

class OvertimeLogSubscriber {
  listenTo() {
    return "OvertimeLog";
  }

  afterInsert(event) {
    console.log("[OvertimeLogSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeId: event.entity?.employeeId,
      date: event.entity?.date,
      hours: event.entity?.hours,
      amount: event.entity?.amount
    });
  }

  afterUpdate(event) {
    console.log("[OvertimeLogSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName)
    });
  }

  afterRemove(event) {
    console.log("[OvertimeLogSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id
    });
  }
}

module.exports = OvertimeLogSubscriber;
