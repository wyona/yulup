import antlr.*;

public class Main {
    public static void main(String[] args) throws Exception {
        ExprLexer  lexer  = new ExprLexer(System.in);
        ExprParser parser = new ExprParser(lexer);
        parser.locationPath();
    }
}
