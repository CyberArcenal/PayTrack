// src/subscribers/EmployeeSubscriber.js

const Employee = require("../entities/Employee");

//@ts-check
console.log("[Subscriber] Loading EmployeeSubscriber");

class EmployeeSubscriber {
  listenTo() {
    return Employee;
  }

  /**
   * @param {{ entity: { id: any; employeeNumber: any; }; }} event
   */
  afterInsert(event) {
    console.log("[EmployeeSubscriber] afterInsert:", {
      id: event.entity?.id,
      employeeNumber: event.entity?.employeeNumber,
      entity: event.entity,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[EmployeeSubscriber] afterUpdate:", {
      id: event.entity?.id,
      changes: event.updatedColumns?.map(
        (/** @type {{ propertyName: any; }} */ c) => c.propertyName,
      ),
      entity: event.entity,
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[EmployeeSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
      entity: event.entity,
    });
  }
}

module.exports = EmployeeSubscriber;
