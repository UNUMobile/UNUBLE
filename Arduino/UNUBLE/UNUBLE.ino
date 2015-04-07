#include <IRremote.h>
#include <SoftwareSerial.h>
SoftwareSerial UNUBLE(7, 8); // RX, TX
#define OUT

int RECV_PIN = 5;
int LED_PIN = 6;
IRrecv irrecv(RECV_PIN);
IRsend irsend;
decode_results results;
unsigned int IRBuffer = 0;

char inData[20]; // Allocate some space for the string
char inChar=-1; // Where to store the character read
byte index = 0; // Index into array; where to store the character

void setup()
{
  Serial.begin(9600);
  UNUBLE.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  if (irrecv.decode(&results)) {
    long unsigned int irCode = results.value;
    UNUBLE.print(irCode);
    irrecv.resume(); // Receive the next value
    
    switch(irCode)
    {
      case 16753245: digitalWrite(LED_PIN, HIGH); break;
      default : digitalWrite(LED_PIN, LOW); break;
    }
  }

    if (Comp("IR Rec")) {
        irrecv.enableIRIn(); // Start the receiver
        Serial.write("IR Listening\n");
        UNUBLE.write("IR Listening");
    }
  
  if(Serial.available())
  {
    String command="";
    int temp = 10;
    while(Serial.available())
    {
      temp = Serial.read();
      if(temp != 10)
        command += (char)temp;
    }
    UNUBLE.print(command);
  }  
}

boolean Comp(char* This) {
    while (UNUBLE.available() > 0) // Don't read unless
                                   // there you know there is data
    {
        if(index < 19) // One less than the size of the array
        {
            inChar = UNUBLE.read(); // Read a character
            inData[index] = inChar; // Store it
            index++; // Increment where to write next
            inData[index] = '\0'; // Null terminate the string
        }
    }

    if (strcmp(inData,This)  == 0) {
        for (int i=0;i<19;i++) {
            inData[i]=0;
        }
        index=0;
        return true;
    }
    else {
        return false;
    }
}

