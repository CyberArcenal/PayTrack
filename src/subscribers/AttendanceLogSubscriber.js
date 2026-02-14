// src/subscribers/AttendanceLogSubscriber.js
//@ts-check
const AttendanceLog = require("../entities/AttendanceLog");

console.log("[Subscriber] Loading AttendanceLogSubscriber");

class AttendanceLogSubscriber {
  listenTo() {
    return AttendanceLog;
  }

  /**
   * @param {{ entity: { id: any; employeeId: any; timestamp: any; }; }} event
   */
  afterInsert(event) {
    console.log("[AttendanceLogSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeId: event.entity?.employeeId,
      timestamp: event.entity?.timestamp,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[AttendanceLogSubscriber] afterUpdate:", {
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
    console.log("[AttendanceLogSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = AttendanceLogSubscriber;
