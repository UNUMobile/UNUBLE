// JavaScript code for the Arduino EasyBLE example app.
// This code uses the library in easy-ble.js.

// Called when HTML page has been loaded.
$(document).ready(function()
{

});

// Application object, holds data and functions.
var app =
{
	// Data that is plotted on the canvas.
	dataPoints: [],

	// Reference to the connected device.
	device: null,

	initialize: function()
	{
		document.addEventListener('deviceready', app.onDeviceReady, false);

		// Important reset BLE when page reloads/closes!
		window.hyper && window.hyper.onReload(function()
		{
			easyble.stopScan();
			easyble.closeConnectedDevices();
		});
	},

	// Called when device plugin functions are ready for use.
	onDeviceReady: function()
	{
		app.startScan();	
	},

	startScan: function()
	{
		easyble.startScan(
			function(device)
			{
				//alert(device.name);
				if (device.name == 'UNULamp')
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
				console.log('Error reading services: ' + errorCode);
			});
	},

	startReading: function(device)
	{
		// Set notification to ON.
		device.writeDescriptor(
			'0000ffe1-0000-1000-8000-00805f9b34fb', // Characteristic
			'00002902-0000-1000-8000-00805f9b34fb', // Configuration descriptor
			new Uint8Array([1,0]),
			function() {},
			function(errorCode)
			{
				// This error will happen on iOS, since this descriptor is not
				// listed when requesting descriptors. On iOS you are not allowed
				// to use the configuration descriptor explicitly. It should be
				// safe to ignore this error.
				//console.log('writeDescriptor error: ' + errorCode);
			});

		// Setup notification callback to plot received data.
		device.enableNotification(
			'0000ffe1-0000-1000-8000-00805f9b34fb', // Read characteristic
			function(data)
			{
				var dv = new jDataView(data).getString(data.length);
				var datas = dv.split(',');
				if(datas.length == 6)
				{
					$("#Weater").html(datas[1]);
					$("#Sun").html(datas[2]);
					$("#Humidity").html(datas[3]);
					$("#Temperature").html(datas[4]);
					ShowState(parseInt(datas[5]));
					if(datas[0] == "0")
					app.sync();
				} 

				app.drawLines([new DataView(data).getUint16(0, true)]);
			},
			function(errorCode)
			{
				console.log('enableNotification error: ' + errorCode);
			});
	},
	
	sync: function()
	{
		var date = new Date();
		var UTCstring = Math.round((date.getTime()/1000) - (date.getTimezoneOffset()*60));
		dt = 'T'+UTCstring.toString();
		app.device && app.device.writeCharacteristic(
			'0000ffe1-0000-1000-8000-00805f9b34fb', // Write characteristic
			new Uint8Array(getSendArray(dt)),
			function() {},
			function(errorCode)
			{
				console.log('writeCharacteristic error: ' + errorCode);
			});		
			
	},
	
	sendText: function(text,fontName)
	{
		text = text+"\n";
		while(text!="")
		{
			var lens = text.length;
			var buffer = text.substring(0,15);
			text = text.substring(15,lens);	
			sendMessage(buffer);
		}
	},
	
	pollRSSI:function()
	{
		app.device && app.device.readRSSI(
			function(rssi) {
				alert(rssi);
			},
			function(errorCode)
			{
				alert(errorCode);
				console.log('writeCharacteristic error: ' + errorCode);
			});
	},

	on: function()
	{
		app.device && app.device.writeCharacteristic(
			'0000ffe1-0000-1000-8000-00805f9b34fb', // Write characteristic
			new Uint8Array([33]),
			function() {},
			function(errorCode)
			{
				console.log('writeCharacteristic error: ' + errorCode);
			});
	},

	off: function()
	{
		app.device && app.device.writeCharacteristic(
			'0000ffe1-0000-1000-8000-00805f9b34fb', // Write characteristic
			new Uint8Array([0]),
			function() {},
			function(errorCode)
			{
				console.log('writeCharacteristic error: ' + errorCode);
			});
	},

	drawLines: function(dataArray)
	{
		var canvas = document.getElementById('canvas');
		var context = canvas.getContext('2d');
		var dataPoints = app.dataPoints;

		dataPoints.push(dataArray);
		if (dataPoints.length > canvas.width)
		{
			dataPoints.splice(0, (dataPoints.length - canvas.width));
		}

		var magnitude = 1024;

		function calcY(i)
		{
			return ((i * canvas.height) / (magnitude * 2)) + (canvas.height / 2);
		}

		function drawLine(offset, color)
		{
			context.strokeStyle = color;
			context.beginPath();
			context.moveTo(0, calcY(dataPoints[dataPoints.length-1][offset]));
			var x = 1;
			for (var i = dataPoints.length - 2; i >= 0; i--)
			{
				var y = calcY(dataPoints[i][offset]);
				context.lineTo(x, y);
				x++;
			}
			context.stroke();
		}

		context.clearRect(0, 0, canvas.width, canvas.height);
		drawLine(0, '#f00');
	}
};
// End of app object.

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
			'0000ffe1-0000-1000-8000-00805f9b34fb', // Write characteristic
			new Uint8Array(getSendArray(str)),
			function() {},
			function(errorCode)
			{
				console.log('writeCharacteristic error: ' + errorCode);
			});	
}