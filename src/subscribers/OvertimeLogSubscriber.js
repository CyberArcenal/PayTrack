// src/subscribers/OvertimeLogSubscriber.js

const OvertimeLog = require("../entities/OvertimeLog");

//@ts-check
console.log("[Subscriber] Loading OvertimeLogSubscriber");

class OvertimeLogSubscriber {
  listenTo() {
    return OvertimeLog;
  }

  /**
   * @param {{ entity: { id: any; employeeId: any; date: any; hours: any; amount: any; }; }} event
   */
  afterInsert(event) {
    console.log("[OvertimeLogSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeId: event.entity?.employeeId,
      date: event.entity?.date,
      hours: event.entity?.hours,
      amount: event.entity?.amount,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[OvertimeLogSubscriber] afterUpdate:", {
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
    console.log("[OvertimeLogSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = OvertimeLogSubscriber;
