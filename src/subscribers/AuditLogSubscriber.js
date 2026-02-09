// src/subscribers/AuditLogSubscriber.js
console.log("[Subscriber] Loading AuditLogSubscriber");

class AuditLogSubscriber {
  listenTo() {
    return "AuditLog";
  }

  afterInsert(event) {
    console.log("[AuditLogSubscriber] afterInsert:", {
      id: event.entity?.id,
      entity: event.entity?.entity,
      action: event.entity?.action,
      user: event.entity?.user
    });
  }

  afterUpdate(event) {
    console.log("[AuditLogSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName)
    });
  }

  afterRemove(event) {
    console.log("[AuditLogSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id
    });
  }
}

module.exports = AuditLogSubscriber;
