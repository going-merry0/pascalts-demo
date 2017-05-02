(function() {
  "use strict"

  const hello = `PROGRAM hello (output);

{Write 'Hello, world.' ten times.}

VAR
    i : integer;

BEGIN {hello}
    FOR i := 1 TO 10 DO Begin
        writeln('Hello, world.');
    END;
END {hello}.
`

  const recursive = `PROGRAM recursive1;

PROCEDURE proc2(n : integer); forward;

FUNCTION func2(n : integer) : integer;

    FUNCTION func3(n : integer) : integer;
        BEGIN
            writeln('    Start func3');
            proc2(6);
            func3 := 3;
            writeln('    Return func3');
        END;

    BEGIN {func2}
        writeln('  Start func2');
        func2 := func3(5) - 1;
        writeln('  Return func2');
    END;

PROCEDURE proc2;

    PROCEDURE proc3(n : integer);
        VAR k : integer;

        BEGIN
            writeln('    Start proc3');
            CASE n OF
                2: proc3(3);
                3: k := func2(4);
            END;
            writeln('    Return proc3');
        END;

    BEGIN {proc2}
        writeln('  Start proc2');
        CASE n OF
            1: proc3(2);
            6: proc3(7);
        END;
        writeln('  Return proc2');
    END;

BEGIN {main1}
    writeln('Start recursive1');
    proc2(1);
    writeln('End recursive1');
END.
`

  const factorial = `PROGRAM factorials (output);

VAR
    number : integer;

FUNCTION fact(n : integer) : integer;

    BEGIN
	IF n <= 1 THEN fact := 1
		  ELSE fact := n*fact(n - 1);
    END;

BEGIN
    number := 0;
    REPEAT
	writeln('number = ', number,
		'   number! = ', fact(number));
        number := number + 1;
    UNTIL number > 7;
END.
`

  const newton = `PROGRAM newton;

CONST
    epsilon = 1e-6;

VAR
    number : integer;

FUNCTION root(x : real) : real;
    VAR
        r : real;

    BEGIN
        r := 1;
        REPEAT
            r := (x/r + r)/2;
        UNTIL abs(x/sqr(r) - 1) < epsilon;
        root := r;
    END;

PROCEDURE print(n : integer; root : real);
    BEGIN
        writeln('The square root of ', number, ' is ', root);
    END;

BEGIN
    writeln;
    number := 4;

    IF number = 0 THEN BEGIN
        print(number, 0.0);
    END
    ELSE IF number < 0 THEN BEGIN
        writeln('*** ERROR:  number < 0');
    END
    ELSE BEGIN
        print(number, root(number));
    END
END.
`

  const hanoi = `PROGRAM hanoi (input, output);

TYPE
    pole   = (left, middle, right);
    number = 1..10;

VAR
    disks : number;

PROCEDURE move (n : number; source, aux, dest : pole);

    PROCEDURE printmove;

	PROCEDURE printpole (p : pole);

	    BEGIN
		CASE p OF
		    left   : write('left  ');
		    middle : write('middle');
		    right  : write('right ');
		END;
	    END;

	BEGIN
	    write('Move a disk from ');  printpole(source);
	    write(' to ');               printpole(dest);
	    writeln;
	END;

    BEGIN
        IF n = 1 THEN printmove
        ELSE BEGIN
            move(n-1, source, dest, aux);
            printmove;
            move(n-1, aux, source, dest);
        END;
    END;

BEGIN
    disks := 5;

    REPEAT
        writeln;
        write('Number of disks (1-10, 1 to stop)? ');

        IF (disks > 1) AND (disks <= 10) THEN BEGIN
            writeln;
            writeln('For ', disks, ' disks, the required moves are:');
            writeln;
            move(disks, left, middle, right);
            disks := disks - 1;
        END
        ELSE IF disks <> 1 THEN BEGIN
            writeln('*** Invalid number of disks.');
        END
    UNTIL disks = 1;
END.
`

  const samples = {
    hello: hello,
    recursive: recursive,
    factorial: factorial,
    newton: newton,
    hanoi: hanoi,
    onchange: (src) => {
    },
    showDefault: () => {
      $('#samples').change()
    },
    currentCode: ''
  }

  $(function() {
    $('#samples').on('change', function() {
      const val = $(this).val()
      const src = samples[val] || ''
      samples.currentCode = src
      samples.onchange(src)
    })
  })

  window.samples = samples
})()
