/*
 * UNU BLE
 */
 
var characteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';
var configDescriptor = '00002902-0000-1000-8000-00805f9b34fb';
var bleName = "UNU";
 
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
		
		// Important reset BLE when page reloads/closes!
		window.hyper && window.hyper.onReload(function()
		{
			easyble.stopScan();
			easyble.closeConnectedDevices();
		});		
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {


        console.log('Received Event: ' + id);
				// This error will happen on iOS, since this descriptor is not
				// listed when requesting descriptors. On iOS you are not allowed
				// to use the configuration descriptor explicitly. It should be
				// safe to ignore this error.
				//cons
		
		app.startScan();
    },
	startScan: function()
	{
		easyble.startScan(
			function(device)
			{
				if (device.name == bleName)
				{
					app.connect(device);
				}
			},
			function(errorCode)
			{
				console.log('startScan error: ' + errorCode);
			});
	},

	connect: function(device)
	{
		easyble.stopScan();
		device.connect(
			function(device)
			{
				// Save reference to the device object.
				app.device = device;
				
				var parentElement = document.getElementById('deviceready');
				var listeningElement = parentElement.querySelector('.listening');
				var receivedElement = parentElement.querySelector('.received');
		
					listeningElement.setAttribute('style', 'display:none;');
					receivedElement.setAttribute('style', 'display:block;');	
					// Get services info.
					app.getServices(device);			
			},
			function(errorCode)
			{
				console.log('connect error: ' + errorCode);
			});
	},

	getServices: function(device)
	{
		device.readServices(
			null, // null means read info for all services
			function(device)
			{
				app.startReading(device);
			},
			function(errorCode)
			{
				alert(errorCode);
				console.log('Error reading services: ' + errorCode);
			});
	},

	startReading: function(device)
	{
		// Set notification to ON.
		device.writeDescriptor(
			characteristic, // Characteristic
			configDescriptor, // Configuration descriptor
			new Uint8Array([1,0]),
			function() {},
			function(errorCode)
			{console.log('writeDescriptor error: ' + errorCode);
			});

		// Setup notification callback to plot received data.
		device.enableNotification(
			characteristic, // Read characteristic
			function(data)
			{
				var dv = new jDataView(data).getString(data.length);
				$("#message").html(dv);
			},
			function(errorCode)
			{
				alert(errorCode);
				console.log('enableNotification error: ' + errorCode);
			});
	},	
	pollRSSI:function()
	{
		app.device && app.device.readRSSI(
			function(rssi) {
				rssi = 0-rssi;
				if(rssi < 40)
				{
					app.pio2On();
					app.pio3On();
				}
				else if(rssi >= 40 && rssi <= 70)
				{
					app.pio3On();
					app.pio2Off()
				}
				else
				{
					app.pio2Off();
					app.pio3Off();
				}
					
				$("#rssi").text(rssi);
			},
			function(errorCode)
			{
				$("#message").html(errorCode);
				easyble.closeConnectedDevices();
				app.startScan();
				console.log('writeCharacteristic error: ' + errorCode);
			});
	},
	watchRSSI:function()
	{
		RSSIObj = setInterval(
		function()
		{
				app.pollRSSI();
		}
		,1000);
	},

	pio2On: function()
	{
		sendMessage("AT+PIO21");
	},

	pio2Off: function()
	{
		sendMessage("AT+PIO20");
	},
	
	pio3On: function()
	{
		sendMessage("AT+PIO31");
	},	
	
	pio3Off: function()
	{
		sendMessage("AT+PIO30");
	},	
	
	sendCommand: function()
	{
		var command = $("#command").val();
		sendMessage(command);
	}
};

function getSendArray(str)
{
	var datas = [];
	
	for (var i = 0; i < str.length; i++)
	{
    	datas.push(str.charCodeAt(i));
	}
	return datas;
}

function sendMessage(str)
{
		app.device && app.device.writeCharacteristic(
			characteristic, // Write characteristic
			new Uint8Array(getSendArray(str)),
			function() {},
			function(errorCode)
			{
				$("#message").html(errorCode);
				easyble.closeConnectedDevices();
				app.startScan();
				console.log('writeCharacteristic error: ' + errorCode);
			});	
}

app.initialize();