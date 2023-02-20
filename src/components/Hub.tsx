import * as React from 'react'
import {useEffect, useState} from 'react'
import {Connection} from "../common/connection";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader, Icon,
    IconButton,
    List,
    ListItem,
    ListSubheader, Menu, MenuItem, SvgIcon
} from "@mui/material";
import './Hub.css';

interface HubConnection extends Connection {
    isRunning?: boolean; // TODO: Determine this on page load (ask the extension itself)
}

function getVariant(h: HubConnection): "text" | "contained" | "outlined" | undefined {
    return h.isRunning ? "text" : "contained"
}

const debug = false;

const Hub = () => {

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [connections, setConnections] = useState<HubConnection[]>([]);
    const [pending, setPending] = useState<HubConnection[]>([]);
    const [checked, setChecked] = useState<boolean>(false);

    useEffect(() => {
        if (!checked) {
            chrome.runtime.sendMessage(
                {
                    action: "get_connections",
                },
                (c: HubConnection[]) => {
                    setConnections(c.filter(v => v.isRegistered));
                    setPending(c.filter(v => !v.isRegistered));
                },
            );
            setChecked(true);
        }
    })

    chrome.notifications.onButtonClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
    })

    return (
        <>
            <Card>
                <CardHeader
                    action={
                        <IconButton aria-label="settings" onClick={handleClick}>
                            <SvgIcon>
                                <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
                            </SvgIcon>
                        </IconButton>
                    }
                    title="Firefly III Extension Hub"
                />
                <CardContent>
                    <List>
                        <ListSubheader>Connections:</ListSubheader>
                        {connections?.length === 0 &&
                            <ListItem>No connections found. Try reloading your scraper extension(s) and then reload this
                                page.</ListItem>
                        }
                        {connections.map(c => (
                            <ListItem className={"connection"}>
                                <div className={"icon secondary"} style={{backgroundColor: `#${c.secondaryColor}`}}>
                                    <div className={"icon primary"}
                                         style={{backgroundColor: `#${c.primaryColor}`}}></div>
                                </div>
                                <div>{c.name}</div>
                                <div className={"spacer"}></div>
                                <Button
                                    variant={getVariant(c)}
                                    onClick={async () => {
                                        if (c.isRunning) {
                                            await chrome.runtime.sendMessage(c.id, {
                                                action: "cancel_auto_run",
                                            })
                                            setConnections(connections.map(v => {
                                                if (v.id === c.id) {
                                                    v.isRunning = false;
                                                }
                                                return v;
                                            }))
                                        } else {
                                            await chrome.runtime.sendMessage(c.id, {
                                                action: "request_auto_run",
                                            })
                                            setConnections(connections.map(v => {
                                                if (v.id === c.id) {
                                                    v.isRunning = true;
                                                }
                                                return v;
                                            }))
                                        }
                                    }}
                                >
                                    {c.isRunning
                                        ? <span>Cancel</span>
                                        : <span>Auto-Run</span>
                                    }
                                </Button>
                            </ListItem>
                        ))}
                    </List>

                    {pending?.length > 0 &&
                        <>
                            <List>
                                <ListSubheader>Pending connections:</ListSubheader>
                                <ListItem>
                                    Clicking the "Grant" button will give each
                                    extension permission to talk to this hub
                                    and to communicate with your Firefly III instance.
                                </ListItem>
                                {pending.map(c => (
                                    <ListItem className={"connection"}>
                                        <div className={"icon secondary"}
                                             style={{backgroundColor: `#${c.secondaryColor}`}}>
                                            <div className={"icon primary"}
                                                 style={{backgroundColor: `#${c.primaryColor}`}}></div>
                                        </div>
                                        <div>{c.name}</div>
                                        <div className={"spacer"}></div>
                                        <Button
                                            color={"error"}
                                            variant={getVariant(c)}
                                            onClick={async () => {
                                                chrome.runtime.sendMessage(
                                                    {
                                                        action: "grant_registration",
                                                        extension_id: c.id,
                                                    },
                                                    () => {
                                                    },
                                                );
                                                window.close();
                                            }}
                                        >
                                            <span>Grant</span>
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    }
                </CardContent>
                <CardActions>
                    <Button variant={"contained"} disabled={connections?.length === 0} onClick={() => {
                        connections.forEach(
                            async connection => {
                                await chrome.runtime.sendMessage(connection.id, {
                                    action: "request_auto_run",
                                })
                                // TODO: Add "cancel auto run" button
                                const port = chrome.runtime.connect(connection.id);
                                port.postMessage({
                                    action: "request_auto_run",
                                })
                            }
                        );
                        setConnections(connections.map(v => {
                            v.isRunning = true;
                            return v;
                        }))
                        chrome.storage.local.set({
                            firefly_iii_last_run: new Date(),
                        })
                    }}>
                        Run auto-export for all connections
                    </Button>

                    <Button onClick={() => {
                        chrome.runtime.sendMessage(
                            {
                                action: "refresh_auth",
                            },
                            () => {
                            },
                        );
                    }}>
                        Refresh Auth
                    </Button>

                    {debug &&
                        <>
                            <Button onClick={() => {
                                chrome.notifications.create("", {
                                    iconUrl: "logo-128.png",
                                    message: "It's been over a week since your last export!",
                                    type: "basic",
                                    title: "Weekly transaction export",
                                    buttons: [{
                                        title: "Click to open"
                                    }],
                                })
                            }}>Test Notification
                            </Button>
                        </>
                    }
                </CardActions>
            </Card>

            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={() => {
                    chrome.runtime.openOptionsPage();
                    handleClose();
                }}>Open in new tab</MenuItem>
            </Menu>
        </>
    );
};

export default Hub;