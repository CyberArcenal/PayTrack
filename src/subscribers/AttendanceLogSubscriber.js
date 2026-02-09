// src/subscribers/AttendanceLogSubscriber.js
console.log("[Subscriber] Loading AttendanceLogSubscriber");

class AttendanceLogSubscriber {
  listenTo() {
    return "AttendanceLog";
  }

  afterInsert(event) {
    console.log("[AttendanceLogSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeId: event.entity?.employeeId,
      timestamp: event.entity?.timestamp
    });
  }

  afterUpdate(event) {
    console.log("[AttendanceLogSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName)
    });
  }

  afterRemove(event) {
    console.log("[AttendanceLogSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id
    });
  }
}

module.exports = AttendanceLogSubscriber;
