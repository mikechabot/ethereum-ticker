'use strict';

module.exports = function domainPropertyPlugin(schema, options) {
    schema.add({
        updatedDate: Date,
        createdDate: Date,
        deleted: Boolean
    });
    schema.pre('save', function (next) {
        if (this.isNew) this.createdDate = new Date();
        this.updatedDate = new Date();
        next();
    });
};