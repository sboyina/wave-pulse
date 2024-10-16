import { UIAgentContext } from "@/hooks/hooks";
import { Modal, ModalHeader, ModalContent, ModalBody, ModalFooter, Button, useDisclosure, Select, SelectItem, Switch, Input } from "@nextui-org/react";
import { useCallback, useContext, useEffect, useState } from "react";
import {IconImport} from '@/components/icons';
import axios from "axios";


export const Settings = (props: {
    isOpen?: boolean,
    onOpen?: Function,
    onClose?: Function
}) => {
   
    const {isOpen, onOpen, onOpenChange, } = useDisclosure();
    const uiAgent = useContext(UIAgentContext);
    const [isConnected, setIsConnected] = useState(uiAgent.isConnected);
    const [selectedSessionData, setSelectedSessionData] = useState(uiAgent.sessionDataKey);
    const [sessionDataArr, setSessionDataArr] = useState([]);
    const applyFn = useCallback((onClose: Function) => {
        uiAgent.sessionDataKey = selectedSessionData;
    }, [isConnected, selectedSessionData]);
    useEffect(() => {
        if (props.isOpen) {
            onOpen();
        }
    }, [props.isOpen]);
    useEffect(() => {
        if (isOpen) {
            props.onOpen && props.onOpen();
        } else {
            props.onClose && props.onClose();
        }
    }, [isOpen]);
    useEffect(() => {
        uiAgent.listSessionData().then((data) => {
            setSessionDataArr(data);
        });
    }, [props.isOpen]);
    useEffect(() => {
        setIsConnected(uiAgent.isConnected);
    }, [uiAgent.isConnected]);

    const handleFileSelect = async (e:any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload =async  function(event:any) {
            const formData = new FormData();
            formData.append('name', e.target.files[0].name);
            formData.append('content', JSON.stringify(event.target.result));
            console.log('JSON.stringify(event.target.result)',JSON.stringify(event.target.result));
        try {
            const response = await axios.post(`/api/session/data/${e.target.files[0].name}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
        
            if (response.status === 200) {
              console.log('File uploaded successfully:', response.data);
            } else {
              console.error('Upload failed');
            }
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        };
      
        reader.readAsText(file);

                
    }

    return (
        <Modal size='4xl' isOpen={isOpen} onOpenChange={onOpenChange}>
           <ModalContent>
            {(onClose) => (
                <>
                <ModalHeader className="flex flex-col gap-1">Settings</ModalHeader>
                <ModalBody className="min-h-72">
                    <div className="flex flex-row border-b content-center">
                        <div className="flex flex-shrink-0 flex-wrap content-center text-sm font-bold w-6/12 px-4 py-1">
                            Connected To Device
                        </div>
                        <div className="py-2 w-6/12">
                            <Switch isSelected={isConnected} onValueChange={(isSelected) => {
                                setIsConnected(isSelected);
                                setSelectedSessionData('');
                            }}/>
                        </div>
                    </div>
                    <div className="flex flex-row border-b">
                        <div className="flex flex-shrink-0 flex-wrap content-center text-sm font-bold w-6/12 px-4 py-1">Load from old session</div>
                        <div className="py-1 w-6/12">
                        <Select size="md" 
                            className="max-w-xs" 
                            placeholder="Load from" 
                            selectedKeys={[selectedSessionData]}
                            onSelectionChange={(s) => {
                                setSelectedSessionData((s ? s.currentKey : '') || '');
                            }}>
                            {sessionDataArr.map((o: string) => (
                            <SelectItem key={o}>
                                {o.substring(0, o.lastIndexOf('.'))}
                            </SelectItem>
                            ))}
                        </Select>
                        </div>



                        <div className=" flex items-center py-1">
                            <input
                                type="file"
                                onChange={(event)=>handleFileSelect(event)}
                                style={{ display: 'none' }}
                                id="fileInput"
                            />
                            <label htmlFor="fileInput" className=" cursor-pointer">
                                <IconImport size={36} color="black"  />
                            </label>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" variant="light" onPress={onClose}>Close</Button>
                    <Button color="default" onPress={() => {
                        applyFn(onClose)
                    }}>Apply</Button>
                </ModalFooter>
                </>
            )}
            </ModalContent>
        </Modal>
    );
};