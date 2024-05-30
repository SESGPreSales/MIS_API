
## Clone Repo to local 

 ```
 git clone ...
 ``` 
then 
```
cd MIS_API
```
then 
```
npm install
```
then create a file named `.env` in the root folder, add your env details

```yaml
MIS_SERVER="YOURSERVER" #including https://...
MIS_PORT="YOURPORT"
MIS_USER="YOURUSER"
MIS_PASSWORD="YOURPASSWORD"
DEVICE_ID="DEVICEMAC" #Add the Mac Address of the device to be queried. (only one device...)
DEVICE_IP="YOURDEVICEIP" #If in the same LAN, you can add DEvice IP here to have an MDC command sent to check EcoSensor Value
TIMEOUT=10000 # timeout between the calls (do not go under 5000!)
```
then

```
npm run dev
```
