
insert into NeumaticosAutos (marca,medida) values 
('Pirelli', '175/65/14'),
('Fate', '175/65/14')
('Yokohama', '175/65/16'),
('Pirelli', '175/65/15'),
('Fate', '175/65/15')


--tabla original
CREATE TABLE NeumaticosAutos (
    neumatico_id INT IDENTITY(1,1) PRIMARY KEY,
    medida VARCHAR(50),
    marca VARCHAR(50),
    proveedor VARCHAR(50),
    stock INT,
    sucursal VARCHAR(50),
    costo DECIMAL(10, 2),
    precio_venta DECIMAL(10, 2),
    modelo VARCHAR(50)
);
--tabla que usa el sp
CREATE TABLE NeumaticosAutosStaging (
    medida VARCHAR(50),
    modelo VARCHAR(50),
    marca VARCHAR(50),
    costo VARCHAR(50),
    precio_venta VARCHAR(50)
);


create view consultaCliente
as
Select medida, marca, modelo, precio_venta from NeumaticosAutos


--sp que carga datos desde csv
CREATE or alter PROCEDURE LoadNeumaticosFromCSV
    @filePath NVARCHAR(255)
AS
BEGIN
    -- Step 1: Clear the staging table
    TRUNCATE TABLE NeumaticosAutosStaging;

    -- Step 2: Construct the BULK INSERT command
    DECLARE @bulkInsertCommand NVARCHAR(1000);
    SET @bulkInsertCommand = N'
        BULK INSERT NeumaticosAutosStaging
        FROM ''' + @filePath + N'''
        WITH (
            FIELDTERMINATOR = '','',
            ROWTERMINATOR = ''\n'',
            FIRSTROW = 1,
            CODEPAGE = ''ACP''
        );
    ';

    -- Execute the BULK INSERT command
    EXEC sp_executesql @bulkInsertCommand;

    -- Step 3: Insert data into the final table
    INSERT INTO NeumaticosAutos (medida, modelo, marca, costo, precio_venta)
    SELECT 
        medida,
        modelo,
        marca,
        costo,
        precio_venta
    FROM NeumaticosAutosStaging;

    -- Step 4: Optionally, clear the staging table again
    TRUNCATE TABLE NeumaticosAutosStaging;
END;



EXEC LoadNeumaticosFromCSV 'C:\Users\maria\OneDrive\Desktop\Book1.csv';


SELECT * FROM consultaCliente WHERE medida LIKE '175/65%14%';


UPDATE consultaCliente
SET medida = '175/65R14'
WHERE medida = '175/65/14'

delete consultaCliente
WHERE medida = '175/65R14' and marca = 'Fate'

SELECT * FROM consultaCliente WHERE medida LIKE '175%65%14%';

SELECT * FROM consultaCliente WHERE medida LIKE 'x%y%z%';
