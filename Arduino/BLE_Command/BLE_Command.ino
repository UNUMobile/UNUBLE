#include <SoftwareSerial.h>
SoftwareSerial UNUBLE(7, 8); // RX, TX

void setup()
{
  Serial.begin(9600);
  UNUBLE.begin(9600);
}

void loop() {
  if(UNUBLE.available()) 
  {
    while(UNUBLE.available())
    {
      Serial.print((char)UNUBLE.read());
    }
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


