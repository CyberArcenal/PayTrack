// src/subscribers/EmployeeSubscriber.js
console.log("[Subscriber] Loading EmployeeSubscriber");

class EmployeeSubscriber {
  listenTo() {
    return "Employee";
  }

  afterInsert(event) {
    console.log("[EmployeeSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeNumber: event.entity?.employeeNumber,
      entity: event.entity
    });
  }

  afterUpdate(event) {
    console.log("[EmployeeSubscriber] afterUpdate:", {
      id: event.entity?.id,
      changes: event.updatedColumns?.map(c => c.propertyName),
      entity: event.entity
    });
  }

  afterRemove(event) {
    console.log("[EmployeeSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
      entity: event.entity
    });
  }
}

module.exports = EmployeeSubscriber;
