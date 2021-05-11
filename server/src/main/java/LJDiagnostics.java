import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.eclipse.lsp4j.Diagnostic;
import org.eclipse.lsp4j.DiagnosticSeverity;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.Range;
import org.eclipse.lsp4j.TextDocumentIdentifier;
import org.eclipse.lsp4j.TextDocumentItem;
import org.eclipse.lsp4j.VersionedTextDocumentIdentifier;

import repair.regen.api.CommandLineLauncher;
import repair.regen.utils.ErrorEmitter;
import repair.regen.utils.ErrorPosition;

public class LJDiagnostics {
	

	public static Optional<PublishDiagnosticsParams> checkDiagnostics(TextDocumentItem textDocumentItem) {
		return verifyFile(textDocumentItem.getUri());
	}
	

	public static Optional<PublishDiagnosticsParams> checkDiagnostics(TextDocumentIdentifier textDocumentItem) {
		return verifyFile(textDocumentItem.getUri());
	}
	
	
	private static Optional<PublishDiagnosticsParams> verifyFile(String uri){
		String s = "C:/Regen/test-projects/src/Main.java";
		ErrorEmitter ee;
		try {
			ee = CommandLineLauncher.launch(s);
		}catch(Exception e) {
			System.err.println("Exception:" + e.getMessage());
			return Optional.empty();
		}
		
		if(!ee.foundError())
			return Optional.empty();
		ErrorPosition pos = ee.getPosition();
		
		PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
		List<Diagnostic> diagnostics = new ArrayList<>();
        Range range = new Range(
                new Position(pos.getLineStart()-1, pos.getColStart()),
                new Position(pos.getLineEnd()-1, pos.getColEnd())
        );
        String posss = String.format("(%d,%d) (%d,%d)", pos.getLineStart(), pos.getColStart(), pos.getLineEnd(), pos.getColEnd());
        diagnostics.add(new Diagnostic(range, "Refinement Error"+pos.getLineStart()+posss,  DiagnosticSeverity.Error, ee.getMessage()));
        diagnosticsParams.setDiagnostics(diagnostics);
        diagnosticsParams.setUri(uri);
		return Optional.of(diagnosticsParams);
	}
	
	

	public static PublishDiagnosticsParams createDiagnostics(TextDocumentIdentifier textDocumentItem) {
        PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
        List<Diagnostic> diagnostics = new ArrayList<>();
        Range range = new Range(
                new Position(0, 1),
                new Position(0, 50)
        );
//        exception.printStackTrace();
        diagnostics.add(new Diagnostic(range, "Error",  DiagnosticSeverity.Error, "Error processing file"));
        diagnosticsParams.setDiagnostics(diagnostics);
        diagnosticsParams.setUri(textDocumentItem.getUri());
//        setBasicDiagnostics(document, diagnosticsParams);
        return diagnosticsParams;
    }

//    private static void setBasicDiagnostics(TextDocumentIdentifier document, PublishDiagnosticsParams diagnosticsParams) {
//        diagnosticsParams.setUri(document.getUri());
//        if(document instanceof VersionedTextDocumentIdentifier) {
//        	diagnosticsParams.setVersion(((VersionedTextDocumentIdentifier) document).getVersion ());
//        }
//    }
////
//	public static Optional<PublishDiagnosticsParams> checkDiagnostics() {
//		// TODO Auto-generated method stub
//		return null;
//	}


//    public static PublishDiagnosticsParams createDiagnostics(TextDocumentIdentifier document, ANTLRParserErrors errors) {
//        PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
//        List<Diagnostic> diagnostics = new ArrayList<>();
//        for(ANTLRParserMessage warning:errors.getWarnings()) {
//            diagnostics.add(createParserDiagnostic(warning, DiagnosticSeverity.Warning));
//        }
//        for(ANTLRParserMessage error:errors.getErrors()) {
//            diagnostics.add(createParserDiagnostic(error, DiagnosticSeverity.Error));
//        }
//TODO: replace ANTLRParserErrors with a better class
// if(document.getExceptionDuringProcessing() != null) {
//            //TODO: stacktrace? some extra message to indicate context?
//            String message = document.getExceptionDuringProcessing().getMessage() == null ? document.getExceptionDuringProcessing().toString() : document.getExceptionDuringProcessing().getMessage();
//            diagnostics.add(new Diagnostic(new Range(new Position(0, 1), new Position(0, 50)), message));
//        }
//
//        diagnosticsParams.setDiagnostics(diagnostics);
//        setBasicDiagnostics(document, diagnosticsParams);
//        return diagnosticsParams;
//    }

//    public static PublishDiagnosticsParams createDiagnosticsFromValidationResult(TextDocumentIdentifier textDocumentItem, DocumentInformation docInfo, ValidationResult validationResult) {
//        PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
//        List<Diagnostic> diagnostics = new ArrayList<>();
//
//        if(validationResult != null) {
//            if(validationResult.hasWarningsOrErrors()) {
//                for(ValidationMessage message:validationResult.getErrors()) {
//                    DocumentSymbol documentSymbol = null;
//                    if(message.getPathInArchetype() != null) {
//                        documentSymbol = docInfo.lookupCObjectOrAttribute(message.getPathInArchetype());
//                    }
//                    if(documentSymbol != null) {
//                        Range range = documentSymbol.getSelectionRange();
//                        diagnostics.add(new Diagnostic(range, toMessage(message), message.isWarning() ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error, "ADL validation", message.getType().toString()));
//                    } else {
//                        Range range = new Range(
//                                new Position(0, 1),
//                                new Position(0, 50)
//                        );
//                        diagnostics.add(new Diagnostic(range, toMessage(message), message.isWarning() ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error, "ADL validation", message.getType().toString()));
//                    }
//                }
//            }
//        }
//        diagnosticsParams.setDiagnostics(diagnostics);
//        setBasicDiagnostics(textDocumentItem, diagnosticsParams);
//        return diagnosticsParams;
//    }

//    private static Diagnostic createParserDiagnostic(ANTLRParserMessage error, DiagnosticSeverity warning) {
//        Range range = new Range(
//                new Position(error.getLineNumber()-1, error.getColumnNumber()),
//                new Position(error.getLineNumber()-1, error.getColumnNumber() + error.getLength())//TODO: archie errors do not keep the position properly
//        );
//
//        return new Diagnostic(range, error.getShortMessage(), warning, "ADL2 syntax");
//    }
//
//    private static String toMessage(ValidationMessage message) {
//        if(message.getMessage() != null) {
//            return message.getMessage();
//        } else {
//            return message.getType().getDescription();
//        }
//    }

}
