jspa.Result = Object.inherit(util.EventTarget, {
	isReady: false,
	isSuccess: false,
	isError: false,
	
	/**
	 * @param parent
	 * @param context
	 * @param onSuccess
	 * @param onError
	 */
	initialize: function(parent, context, onSuccess, onError) {
		this.parent = parent;
		
		if (context && context.isInstanceOf(Function)) {
			onError = onSuccess;
			onSuccess = context;
			context = null;
		}
		
		if (onSuccess) {
			if (context)
				onSuccess = onSuccess.bind(context);
			
			this.on('success', onSuccess);
		}
		
		if (onError) {
			if (context)
				onError = onError.bind(context);
			
			this.on('error', onError);
		}
	},
});