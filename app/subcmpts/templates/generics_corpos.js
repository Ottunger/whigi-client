exports.m = {
    "keys": {
        "generics.corporate": {
            "is_i18n": true,
            "left_num": 1001,
            "holds": ["generics.corp1", "generics.corp2"]
        }
    },
    "holds": {
        "generics.corp1": {
            "open": true,
            "is_i18n": true,
            "holds": ["corporate"]
        },
        "generics.corp2": {
            "open": true,
            "is_i18n": true,
            "holds": ["corporate/address"]
        },
    }
};