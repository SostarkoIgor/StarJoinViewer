import { useEffect, useState } from 'react';
import'./App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7029';

    type TableValue = {
        nazivTablice: string;
        sqlNazivTablice: string;
    };
    
    type Tables = {
        [key: string]: TableValue;
    };

    type DimTablesForFTable = {
        [key: string]: Tables[];
    };
    type DimTableAtr = {
        nazivMjere: string;
        sqlNazivMjere: string;
    };
    type Measure={
        punNazivAtributa: string;
        nazivAtributa: string;
        sqlNazivAtributa: string;
        funkcija: string;
    }
    type DimTableAtrs={
        [key: string]: DimTableAtr[];
    }

    type Measures = {
        [key: string]: Measure;
    };

    type SelectedElement = {
        vrsta: string;
        sqlNaziv: string;
        funkcija: string;
        tablica: string;
    };

    type SelectedElements = {
        [key: string]: SelectedElement;
    };

  
function App() {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [connectionString, setConnectionString] = useState<string>('');
    const [error, setError] = useState<string>('');

    const [hasFetched, setHasFetched] = useState<boolean>(false);
    
    const [factTables, setFactTables] = useState<Tables>({});
    const [dimTables, setDimTables] = useState<Tables>({});

    const [selectedTable, setSelectedTable] = useState<string>('');

    const [factTableDims, setFactTableDims] = useState<DimTablesForFTable>({});
    const [dimTableAtrs, setDimTableAtrs] = useState<DimTableAtrs>({});
    const [fTableMeasures, setFTableMeasures] = useState<Measures>({});

    const [selectedElements, setSelectedElements] = useState<SelectedElements>({});

    const [showDimsForFTable, setShowDimsForFTable] = useState<any>({});
    
    const [showMeasures, setShowMeasures] = useState<boolean>(false);
    const [showDimTables, setShowDimTables] = useState<boolean>(false);

    const generateKey = (table: string, vrsta: string, sqlNaziv: string) => {
        return `${table}-${vrsta}-${sqlNaziv}`;
    };
    const addToSelectedElementsOrDelete = (table: string, vrsta: string, funkcija: string, sqlNaziv: string) => {
        if (!selectedElements[generateKey(table, vrsta, sqlNaziv)]) {
        setSelectedElements((prevState) => ({
            ...prevState,
            [generateKey(table, vrsta, sqlNaziv)]: {
                vrsta,
                sqlNaziv,
                funkcija,
                tablica: table,
            },
        }));
        } else {
            setSelectedElements((prevState) => {
                const newState = { ...prevState };
                delete newState[generateKey(table, vrsta, sqlNaziv)];
                return newState;
            });
        }
    };
    const handleTableClick = (tableName: string) => {
        console.log(dimTableAtrs);
        setSelectedTable(tableName);
        if (!showDimsForFTable[tableName]) {
            setShowDimsForFTable((prevState: any) => ({ ...prevState, [tableName]: {} } as any));
        }
        if (!factTableDims[tableName]) {
            fetch(API_URL + '/getftabledims?connectionString=' + connectionString + '&sifTablica=' + tableName, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(res => res.json())
                .then((data: Tables[]) => {
                    setFactTableDims(prevState => ({
                        ...prevState,
                        [tableName]: data,
                    }));
                })
                .catch(err => {
                    console.error("Greška pri dohvaćanju dimenzijskih tablica:", err);
                });
        }
    };
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const response = await fetch(API_URL + '/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ connectionString }),
        });
        if (response.ok) {
            setIsConnected(true);
            setError('');
        }
        else {
            setError('Failed to connect to the database');
        }
    }
    useEffect(() => {
        if (!isConnected || hasFetched) return;
        const fetchAll = async () => {
            try {
                const factRes = await fetch(`${API_URL}/getfacttables?connectionString=${connectionString}`);
                const factData: Tables = await factRes.json();
                setFactTables(factData);
          
                const dimRes = await fetch(`${API_URL}/getdimtables?connectionString=${connectionString}`);
                const dimData: Tables = await dimRes.json();
                setDimTables(dimData);
        
                const dimKeys = Object.keys(dimData);
          
                const attrFetches = dimKeys.map(sifTablica =>
                  fetch(`${API_URL}/getdimtableatrs?connectionString=${connectionString}&sifTablica=${sifTablica}`)
                    .then(res => res.json())
                    .then(attrs => ({ [sifTablica]: attrs }))
                );

                const measuresFetches = Object.keys(factData).map(sifTablica =>
                  fetch(`${API_URL}/getfmeasures?connectionString=${connectionString}&sifTablica=${sifTablica}`)
                    .then(res => res.json())
                    .then(measures => ({ [sifTablica]: measures }))
                );

                const measuresArray = await Promise.all(measuresFetches);
                const measuresObj = Object.assign({}, ...measuresArray);
                setFTableMeasures(measuresObj);
          
                const attributesArray = await Promise.all(attrFetches);
          
                const attributesObj = Object.assign({}, ...attributesArray);
          
                setDimTableAtrs(attributesObj);
          
                setHasFetched(true);
                if (!isConnected) {
                  setIsConnected(true);
                }
              } catch (err) {
                console.error("Greška pri dohvaćanju tablica ili atributa:", err);
              }
            ;
        }
        fetchAll();

    },[isConnected, hasFetched]);

    if (isConnected) {
        return (
            <div className="App">
                <div className='container'>
                    <div className='top-left'>

                        <div className='title'>Činjenične tablice</div>
                        <div className='factTables'>
                            {Object.keys(factTables).map((key) => (
                                <div className={selectedTable === key ? 'factTableContainer selectedFactTable' : 'factTableContainer'} key={key}>
                                    <span className="material-symbols-outlined tableIcon">
                                    table
                                    </span>
                                    <div className='factTable' onClick={() => handleTableClick(key)}>
                                        
                                        <div className='tableName'>{factTables[key].nazivTablice}</div>
                                        <div className='sqlTableName'>{factTables[key].sqlNazivTablice}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='top-right'></div>
                    <div className='bottom-left'>
                        <div className='title'>
                            <span className="material-symbols-outlined clickableIcon" onClick={() => setShowDimTables(!showDimTables)}>
                                {showDimTables ? 'expand_more' : 'chevron_right'}
                            </span>
                            Dimenzije
                        </div>
                        
                        <div className='dimTables'>
                            {showDimTables && selectedTable && factTableDims[selectedTable] && factTableDims[selectedTable].map((dimTable, index) => (
                                
                                    <div className='dimTable'>
                                        <div className='dimTableContainer' key={index}>
                                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                            <span className="material-symbols-outlined clickableIcon minorIcon"
                                            onClick={() => {
                                                if (!showDimsForFTable[selectedTable][Object.keys(dimTable)[0]]){
                                                    setShowDimsForFTable((prevState: any) => ({
                                                        ...prevState,
                                                        [selectedTable]: {
                                                            ...prevState[selectedTable],
                                                            [Object.keys(dimTable)[0]]: true,
                                                        },
                                                    }));
                                                }
                                                else setShowDimsForFTable((prevState: any) => ({
                                                    ...prevState,
                                                    [selectedTable]: {
                                                        ...prevState[selectedTable],
                                                        [Object.keys(dimTable)[0]]: !prevState[selectedTable][Object.keys(dimTable)[0]],
                                                    },
                                                }));
                                            }}>
                                                {showDimsForFTable[selectedTable][Object.keys(dimTable)[0]] ? 'expand_more' : 'chevron_right'}
                                            </span>
                                            <div>
                                            <div className='tableName'>{dimTable[Object.keys(dimTable)[0]].nazivTablice}</div>
                                            <div className='sqlTableName'>{dimTable[Object.keys(dimTable)[0]].sqlNazivTablice}</div>
                                            </div>
                                            </div>
                                            <div className='dimTableAtrs'>
                                                {showDimsForFTable[selectedTable] && showDimsForFTable[selectedTable][Object.keys(dimTable)[0]] && dimTableAtrs[Object.keys(dimTable)[0]].map((atr: DimTableAtr, index: number) => (
                                                    <div className='dimTableAtr' key={index}>
                                                        <span className="material-symbols-outlined tableIcon listIcon" onClick={() => {addToSelectedElementsOrDelete(Object.keys(dimTable)[0], 'dimAtr', '', atr.sqlNazivMjere)}}>
                                                            {selectedElements[generateKey(Object.keys(dimTable)[0], 'dimAtr', atr.sqlNazivMjere)] ? 'check_box' : 'check_box_outline_blank'}
                                                        </span>
                                                        <div className='dimTableAtrName'>{atr.nazivMjere}</div>
                                                    </div>
                                                ))}
                                            </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='title'>
                            <span className="material-symbols-outlined clickableIcon" onClick={() => setShowMeasures(!showMeasures)}>
                                {showMeasures ? 'expand_more' : 'chevron_right'}
                            </span>
                            Mjere
                        </div>
                        <div className='measures'>
                            {showMeasures && selectedTable && fTableMeasures[selectedTable] && Object.keys(fTableMeasures[selectedTable]).map((key) => (
                                <div className='measure' key={key}>
                                    <span className="material-symbols-outlined tableIcon" onClick={() => {addToSelectedElementsOrDelete(selectedTable, 'mjera', fTableMeasures[selectedTable][key].funkcija, fTableMeasures[selectedTable][key].sqlNazivAtributa)}}>
                                        {selectedElements[generateKey(selectedTable, 'mjera', fTableMeasures[selectedTable][key].sqlNazivAtributa)] ? 'check_box' : 'check_box_outline_blank'}
                                    </span>
                                    <div className='measureName'>{fTableMeasures[selectedTable][key].punNazivAtributa}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='bottom-right'></div>
                </div>
            </div>
        );
    }
    else {
        return (
            <div className="App">
                <form onSubmit={handleSubmit}>
                    <label>DB connection string</label>
                    <input
                        type="text"
                        placeholder='enter connection string...'
                        value={connectionString}
                        onChange={(e) => setConnectionString(e.target.value)}
                    />
                    <button type="submit">Connect</button>
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
        );
    }
}

export default App;