exports.h = [
    {
        "name": "happenings.move",
        "sid": "hap_move",
        "entryStep": 0,
        "steps": [
            {
                "mode": "creating",
                "gen": "profile/address",
                "options": {"share_instead": true},
                "outputs": [
                    {
                        "next": 1,
                        "nextHelp": "happenings.partners"
                    },
                    {"is_terminal": true}
                ]
            },
            {
                "mode": "creating",
                "gen": "family/partners",
                "options": {},
                "outputs": [
                    {
                        "next": 2,
                        "nextHelp": "happenings.children"
                    },
                    {"is_terminal": true}
                ]
            },
            {
                "mode": "creating",
                "gen": "family/children",
                "options": {},
                "outputs": [
                    {
                        "next": 2,
                        "nextHelp": "happenings.children"
                    },
                    {"is_terminal": true}
                ]
            }
        ]
    }
]