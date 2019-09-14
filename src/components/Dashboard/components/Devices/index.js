import React, { useEffect, useState, useRef } from 'react';
import { fetchGetRequest } from '../../../../utils';
import {
  Heading,
  Button,
  Input,
  List,
  ListItem,
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/core';

const Devices = ({ userId, idToken }) => {
  const [devices, setDevices] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [deviceSockets, setDeviceSockets] = useState({});

  useEffect(() => {
    if (devices.length > 0) {
      devices.forEach(device => {
        // if device socket does not exist
        if (!(device.key in deviceSockets)) {
          // let socket = new WebSocket(
          //   `ws://connect.websocket.in/consumo?room_id=${device.key}`
          // );
          // socket.onopen = () => {
          //   socket.send(
          //     JSON.stringify({ status: `Device ${device.key} connected` })
          //   );
          // };
          // setDeviceSockets(sockets => {
          //   Object.assign(sockets, { [device.key]: socket });
          //   return sockets;
          // });
        }
      });
    }
  }, [deviceSockets, devices]);

  const fetchDevices = async (uid, token) => {
    if (uid && token) {
      let userDevices = await fetchGetRequest(
        `/api/device?userId=${uid}`,
        token
      );
      setDevices(userDevices);
    } else {
      console.log('fetchDevices error', uid, token);
    }
  };

  useEffect(() => {
    fetchDevices(userId, idToken);
  }, [idToken, userId]);

  // device name
  const registerDeviceNameInputRef = useRef(null);

  // device id
  const registerDeviceIdInputRef = useRef(null);
  const [isInvalidDeviceId, setIsInvalidDeviceId] = useState(false);
  const [deviceIdInputErrorMessage, setDeviceIdInputErrorMessage] = useState(
    undefined
  );

  const registerDevice = async (uid, token) => {
    const deviceIdInput = registerDeviceIdInputRef.current;
    if (!deviceIdInput.checkValidity()) {
      setIsInvalidDeviceId(true);
      setDeviceIdInputErrorMessage(deviceIdInput.validationMessage);
    } else {
      setIsInvalidDeviceId(false);
      const deviceNameInput = registerDeviceNameInputRef.current;
      const id = deviceIdInput.value;
      const name = deviceNameInput.value;
      if (uid && token && id) {
        await fetch(`/api/device`, {
          method: 'post',
          body: JSON.stringify({ deviceId: id, deviceName: name, userId: uid }),
          headers: new Headers({
            Authorization: 'Bearer ' + token
          })
        })
          .then(() => {
            deviceNameInput.value = '';
            deviceIdInput.value = '';

            fetchDevices(userId, idToken);
          })
          .catch(error => console.log(error));
      } else {
        console.log('registerDevice error', uid, token, id);
      }
    }
  };

  // eslint-disable-next-line no-unused-vars
  const startDevice = (deviceId, type) => {
    deviceSockets[deviceId].send(JSON.stringify({ command: 'start', type }));
  };

  return (
    <>
      <Heading>Register Monitoring Device</Heading>
      <form>
        <FormControl mb={2}>
          <FormLabel htmlFor="device-name">Device Name (optional)</FormLabel>
          <Input
            id="device-name"
            type="text"
            ref={registerDeviceNameInputRef}
            placeholder="Enter new device name"
            size="sm"
            width="50%"
          />
        </FormControl>
        <FormControl isInvalid={isInvalidDeviceId} isRequired>
          <FormLabel htmlFor="device-id">Device ID</FormLabel>
          <Input
            id="device-id"
            type="number"
            ref={registerDeviceIdInputRef}
            placeholder="Enter new device ID"
            size="sm"
            width="50%"
          />
          <FormErrorMessage>{deviceIdInputErrorMessage}</FormErrorMessage>
        </FormControl>

        <Button mt={4} onClick={() => registerDevice(userId, idToken)}>
          Register
        </Button>
      </form>
      <Heading>Devices</Heading>
      <List styleType="disc">
        {devices &&
          devices.map((device, index) => {
            const deviceName = device.deviceName
              ? `(${device.deviceName})`
              : '';
            return (
              <ListItem key={index}>
                {`${device.key} ${deviceName}`}
                {/* <Button onClick={() => startDevice(device.key, 'main')}>
                  Main
                </Button>
                <Button onClick={() => startDevice(device.key, 'simulate')}>
                  Simulate
                </Button> */}
              </ListItem>
            );
          })}
      </List>
    </>
  );
};

export default Devices;
