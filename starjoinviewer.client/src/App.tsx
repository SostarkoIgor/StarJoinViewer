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
        naziv: string;
    };

    type SelectedElements = {
        [key: string]: SelectedElement;
    };

    type DimKeys={
        [key: string]: string;
    }

  
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
    const [dimKeys, setDimKeys] = useState<DimKeys>({});
    const [fTableMeasures, setFTableMeasures] = useState<Measures>({});

    const [selectedElements, setSelectedElements] = useState<SelectedElements>({});

    const [showDimsForFTable, setShowDimsForFTable] = useState<any>({});
    
    const [showMeasures, setShowMeasures] = useState<boolean>(false);
    const [showDimTables, setShowDimTables] = useState<boolean>(false);

    const [query, setQuery] = useState<string>('');
    const [displayQuery, setDisplayQuery] = useState<string>('');

    const [queryResult, setQueryResult] = useState<any[]>([]);

    const [queryError, setQueryError] = useState<string>('');

    const generateKey = (table: string, vrsta: string, sqlNaziv: string, naziv: string) => {
        return `${table}-${vrsta}-${sqlNaziv}-${naziv}`;
    };

    const executeQuery = async () => {
        setQueryError('');
        setQueryResult([]);
        if (query) {
            try {
                const response = await fetch(`${API_URL}/getdatafromsql?connectionString=${connectionString}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ queryString: query }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setQueryResult(data);
                } else {
                    setQueryError('Greška pri izvršavanju upita ' + response.statusText);
                    setQueryResult([]);
                }
            } catch (error) {
                setQueryError('Greška pri izvršavanju upita ' + error);
                setQueryResult([]);
            }
        }
    };
    const generateQuery =() => {
        let selectedElements_ = selectedElements;
        let keys = Object.keys(selectedElements_);
        let query_ = '';
        let displayQuery_ = '';
        let joinConditions: string[] = [];
        let mjere: string[] = [];
        let dimAtr: string[] = [];
        let tablesInQuery: string[] = [];
        let groupBy: string[] = [];
       tablesInQuery.push(factTables[selectedTable].sqlNazivTablice.trim());
        keys.forEach(key => {
            let element = selectedElements_[key];
            if (element.vrsta === 'mjera') {
                mjere.push(`${element.funkcija.trim()}(${factTables[selectedTable].sqlNazivTablice.trim()}.${element.sqlNaziv.trim()}) AS \'${element.naziv.trim()}\'`);
            } else if (element.vrsta === 'dimAtr') {
                dimAtr.push(dimTables[element.tablica].sqlNazivTablice.trim()+'.'+element.sqlNaziv.trim()+` AS \'${element.naziv.trim()}\'`);
                if (!tablesInQuery.includes(dimTables[element.tablica].sqlNazivTablice.trim())) {
                    tablesInQuery.push(dimTables[element.tablica].sqlNazivTablice.trim());
                    joinConditions.push(factTables[selectedTable].sqlNazivTablice.trim()+'.'+dimKeys[element.tablica].trim()+' = '+dimTables[element.tablica].sqlNazivTablice.trim()+'.'+dimKeys[element.tablica].trim());
                    
                }
                groupBy.push(dimTables[element.tablica].sqlNazivTablice.trim()+'.'+element.sqlNaziv.trim());
            
            }
        });
        if (tablesInQuery.length > 0) {
            query_ += 'SELECT ';
            displayQuery_ += 'SELECT \n\n';
        }
        if (mjere.length== 0 && dimAtr.length === 0) {
            query_ += 'TOP 100' + factTables[selectedTable].sqlNazivTablice.trim() + '.*';
            displayQuery_ += 'TOP 100 ' + factTables[selectedTable].sqlNazivTablice.trim() + '.*\n';
        }
        if (mjere.length > 0) {
            query_ += mjere.join(', ')+ ' ';
            displayQuery_ += mjere.join(',\n ') + '\n';
        }
        if (dimAtr.length > 0) {
            if (mjere.length > 0) {
                query_ += ', ';
                displayQuery_ += ', \n';
            }
            query_ += dimAtr.join(', ')+ ' ';
            displayQuery_ += dimAtr.join(',\n ') + '\n';
        }
        if (tablesInQuery.length > 0) {
            query_ += 'FROM ' + tablesInQuery.join(', ') + ' ';
            displayQuery_ += '\nFROM \n\n' + tablesInQuery.join(', ') + '\n';
        }

        if (joinConditions.length > 0) {
            query_ += 'WHERE ' + joinConditions.join(' AND ') + ' ';
            displayQuery_ += '\nWHERE \n\n' + joinConditions.join(' AND ') + '\n';
        }
        if (groupBy.length > 0) {
            query_ += 'GROUP BY ' + groupBy.join(', ');
            displayQuery_ += '\nGROUP BY \n\n' + groupBy.join(', ') + '\n';
        }
        setQuery(query_);
        setDisplayQuery(displayQuery_);
    }
    const addToSelectedElementsOrDelete = (table: string, vrsta: string, funkcija: string, sqlNaziv: string, naziv: string) => {
        if (!selectedElements[generateKey(table, vrsta, sqlNaziv, naziv)]) {
        setSelectedElements((prevState) => ({
            ...prevState,
            [generateKey(table, vrsta, sqlNaziv, naziv)]: {
                vrsta,
                sqlNaziv,
                funkcija,
                tablica: table,
                naziv,
            },
        }));
        } else {
            setSelectedElements((prevState) => {
                const newState = { ...prevState };
                delete newState[generateKey(table, vrsta, sqlNaziv, naziv)];
                return newState;
            });
        }
    };
    const handleTableClick = (tableName: string) => {
        setSelectedTable(tableName);
        setQuery('');
        setDisplayQuery('');
        setSelectedElements({});
        setQueryResult([]);
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
        try{
            generateQuery();
        }
        catch (error) {}
    }
    , [selectedElements, selectedTable, showDimsForFTable, showMeasures, showDimTables]);
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
          
                const dimKeysArray=await fetch(`${API_URL}/getdimkeys?connectionString=${connectionString}`);
                const dimKeysObj: DimKeys = await dimKeysArray.json();
                setDimKeys(dimKeysObj);

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
                                    <div className='factTable' key={key} onClick={() => handleTableClick(key)}>
                                        
                                        <div className='tableName'>{factTables[key].nazivTablice}</div>
                                        <div className='sqlTableName'>{factTables[key].sqlNazivTablice}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='top-right'>
                        <div className='header'>
                            <button className='executeButton' onClick={() => {executeQuery();}}>
                                <span className="material-symbols-outlined executeIcon">
                                    play_arrow
                                </span>
                                Izvrši upit
                            </button>
                            <button className='deleteButton' onClick={() => {
                                setSelectedElements({});
                                setQuery('');
                                setDisplayQuery('');
                            }}>
                                <span className="material-symbols-outlined deleteIcon">
                                    delete
                                </span>
                                Obriši upit
                            </button>
                        </div>
                        <div className='query'>
                            <p className='queryText'>{displayQuery}</p>
                        </div>
                    </div>
                    <div className='bottom-left'>
                        <div className='title'>
                            <span className="material-symbols-outlined clickableIcon" onClick={() => setShowDimTables(!showDimTables)}>
                                {showDimTables ? 'expand_more' : 'chevron_right'}
                            </span>
                            Dimenzije
                        </div>
                        
                        <div className='dimTables'>
                            {showDimTables && selectedTable && factTableDims[selectedTable] && factTableDims[selectedTable].map((dimTable, index) => (
                                
                                    <div className='dimTable' key={index}>
                                        <div className='dimTableContainer'>
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
                                                        <span className="material-symbols-outlined tableIcon listIcon" onClick={() => {addToSelectedElementsOrDelete(Object.keys(dimTable)[0], 'dimAtr', '', atr.sqlNazivMjere, atr.nazivMjere)}}>
                                                            {selectedElements[generateKey(Object.keys(dimTable)[0], 'dimAtr', atr.sqlNazivMjere, atr.nazivMjere)] ? 'check_box' : 'check_box_outline_blank'}
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
                                    <span className="material-symbols-outlined tableIcon listIcon" onClick={() => {addToSelectedElementsOrDelete(selectedTable, 'mjera', fTableMeasures[selectedTable][key].funkcija, fTableMeasures[selectedTable][key].sqlNazivAtributa, fTableMeasures[selectedTable][key].punNazivAtributa)}}>
                                        {selectedElements[generateKey(selectedTable, 'mjera', fTableMeasures[selectedTable][key].sqlNazivAtributa, fTableMeasures[selectedTable][key].punNazivAtributa)] ? 'check_box' : 'check_box_outline_blank'}
                                    </span>
                                    <div className='measureName'>{fTableMeasures[selectedTable][key].punNazivAtributa}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='bottom-right'>
                        <table>
                            <thead>
                                <tr>
                                    <th className='rowIndex'>
                                        {queryError? <p style={{color: 'red', fontWeight: 'bold'}}>{queryError}</p>:
                                        'Uk.'+queryResult.length}
                                    </th>
                                    {queryResult.length > 0 &&
                                        Object.keys(queryResult[0]).map((key) => (
                                        <th key={key}>{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {queryResult.map((row: any, rowIndex: number) => (
                                <tr key={rowIndex}>
                                    <td className='rowIndex'>{rowIndex + 1}</td>
                                    {Object.values(row).map((value, colIndex) => (
                                    <td key={colIndex}>{String(value)}</td>
                                    ))}
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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