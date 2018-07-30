var store = require ('common/store');

module.exports = {
	usher_bcast   : 'CH-BCAST-TO-USHERS',
	usher_unicast : `CH-UCAST-TO-U-${store.get('id')}`,
	pnode_bcast   : 'CH-BCAST-TO-PRESENCE',
	pnode_unicast : `CH-UCAST-TO-P-${store.get('id')}`,
	lnode_bcast   : 'CH-BCAST-TO-LOBBY',
	lnode_unicast : `CH-UCAST-TO-L-${store.get('id')}`,

	get_channel   : function (bcast, node_type, node_id) {
		var names = {
			'usher'    : { plural : 'USHERS',   abbrev : 'U' },
			'presence' : { plural : 'PRESENCE', abbrev : 'P' },
			'lobby'    : { plural : 'LOBBY',    abbrev : 'L' },
		};

		if ((node_type !== 'usher') &&
			(node_type !== 'presence') &&
			(node_type !== 'lobby')
		)
			throw 'incorrect node_type in "get_channel"';

		if (bcast)
			return `CH-BCAST-TO-${names[node_type].plural}`;
		else
			return `CH-UCAST-TO-${names[node_type].abbrev}-${node_id}`;
	},
};
