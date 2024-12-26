# A google assistant project
This project is a rebuild based on the guide: Smart Home Washer CodeLab[https://developers.home.google.com/codelabs/smarthome-washer].

In this implementation:

- Device Management: Devices (e.g., washer, AC, etc.) are encapsulated as individual classes stored in the functions directory.
- Extensibility: To integrate a new device with Google Home, simply create a new class for the device and add it to functions/index.js.
- Device Specifications: The relevant device specifications can be found at Google Home Cloud-to-Cloud Guides[https://developers.home.google.com/cloud-to-cloud/guides].

Additionally, the frontend source code located in the public directory has been refactored for improved performance and maintainability.



### Tech stack  
Cloud Service : firebase functions, firebase hosts, firebase realtimeDatabase

Google Home Relative : OAuth 2.0, Google Developer Console

Other Tech : javascript, Node.js
